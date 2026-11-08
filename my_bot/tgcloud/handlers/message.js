import { api, db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { activeChats, pendingReplies, ownerStats } from '../schema.js';
import { detectIntent } from '../lib/intent.js';
import { smartReply } from '../lib/smartReply.js';
import { isBlocked } from '../lib/blocks.js';
import { getOrCreateCode, resolveCode } from '../lib/codes.js';
import { sendMainMenu } from '../lib/panel.js';

const BOT_USERNAME = 'YOUR BOT ID'; // بدون @

export default async function (message) {
  const text = message.text;
  if (!text) return;

  const uid = message.from.id;

  // ۱) owner در حال نوشتن جواب ناشناسه (معادل ReplyState.replying_to در پایتون).
  //    این چک رو اول از همه می‌ذاریم تا هر چی owner تایپ کنه (حتی اگه با / شروع بشه)
  //    حتماً به‌عنوان جواب فرستاده بشه، نه اینکه قاطی چت خنگ یا دستورها بشه.
  const pending = await db.select().from(pendingReplies).where(eq(pendingReplies.ownerId, uid)).get();
  if (pending) {
    await db.delete(pendingReplies).where(eq(pendingReplies.ownerId, uid)).run();
    try {
      await api.sendMessage({ chat_id: pending.targetId, text });
      await api.sendMessage({ chat_id: uid, text: 'پیام ناشناس ارسال شد ✅' });
    } catch (e) {
      await api.sendMessage({ chat_id: uid, text: `خطا در ارسال پیام ❌: ${e.description ?? e.message}` });
    }
    return;
  }

  // ۲) /link — لینک ناشناس با کد کوتاه و تصادفی، بدون آیدی عددی خام توش
  if (text === '/link') {
    const code = await getOrCreateCode(uid);
    const link = `https://t.me/${BOT_USERNAME}?start=${code}`;
    await api.sendMessage({
      chat_id: uid,
      text: `این لینک ناشناس توئه 👇\nهرکی روش بزنه می‌تونه بدون شناخته شدن بهت پیام بده:\n\n${link}`,
    });
    return;
  }

  // ۳) /panel — پنل مدیریت (لینک، بلاک‌شده‌ها، آمار)
  if (text === '/panel') {
    await sendMainMenu(uid);
    return;
  }

  // ۴) /end — پایان گفتگوی ناشناس فعلی (برای فرستنده‌ای که توی یه چته)
  if (text === '/end') {
    const chat = await db.select().from(activeChats).where(eq(activeChats.senderId, uid)).get();
    if (!chat) {
      await api.sendMessage({ chat_id: uid, text: 'تو الان توی هیچ گفتگوی ناشناسی نیستی 😅' });
      return;
    }
    await db.delete(activeChats).where(eq(activeChats.senderId, uid)).run();
    await api.sendMessage({ chat_id: uid, text: 'گفتگوی ناشناس تموم شد 👋 هر وقت خواستی با یه لینک جدید دوباره وصل شو.' });
    return;
  }

  // ۵) /start (با یا بدون کد دعوت)
  if (text.startsWith('/start')) {
    const parts = text.trim().split(/\s+/);

    if (parts.length > 1) {
      const code = parts[1];
      const ownerId = await resolveCode(code);

      if (ownerId === null) {
        await api.sendMessage({ chat_id: uid, text: 'این لینک معتبر نیست یا منقضی شده 😕' });
        return;
      }

      if (ownerId === uid) {
        await api.sendMessage({ chat_id: uid, text: 'نمی‌تونی به خودت ناشناس پیام بدی 😐' });
        return;
      }

      if (await isBlocked(ownerId, uid)) {
        await api.sendMessage({ chat_id: uid, text: 'متأسفم، بلاک شدی و نمی‌تونی پیام بدی 😶' });
        return;
      }

      await db.insert(activeChats)
        .values({ senderId: uid, ownerId })
        .onConflictDoUpdate({ target: activeChats.senderId, set: { ownerId } })
        .run();

      await api.sendMessage({
        chat_id: uid,
        text: 'وصل شدی 👀\nهرچی بفرستی ناشناس میره براش 😎\nهر وقت خواستی با /end گفتگو رو تموم کن.',
      });
      return;
    }

    await api.sendMessage({
      chat_id: uid,
      text: 'سلام 😅\nمن یه ربات نامه‌رسان خنگم، حرف بزن ببینم چی می‌گی 😂\nبرای مدیریت صندوقت /panel رو بزن.',
    });
    return;
  }

  // ۶) فرستنده در حال چت ناشناس با یه owner هست — پیام رو فوروارد کن
  const chat = await db.select().from(activeChats).where(eq(activeChats.senderId, uid)).get();
  if (chat) {
    const ownerId = chat.ownerId;

    if (await isBlocked(ownerId, uid)) {
      await api.sendMessage({ chat_id: uid, text: 'متأسفم، بلاک شدی و نمی‌تونی پیام بدی 😶' });
      return;
    }

    await api.sendMessage({
      chat_id: ownerId,
      text: `📩 پیام ناشناس:\n${text}`,
      reply_markup: {
        inline_keyboard: [[
          { text: 'Reply ✉️', callback_data: `reply_${uid}` },
          { text: 'Block 🚫', callback_data: `block_${uid}` },
        ]],
      },
    });

    await db.insert(ownerStats)
      .values({ ownerId, receivedCount: 1 })
      .onConflictDoUpdate({
        target: ownerStats.ownerId,
        set: { receivedCount: sql`${ownerStats.receivedCount} + 1` },
      })
      .run();

    await api.sendMessage({ chat_id: uid, text: 'فرستادمش 📬' });
    return;
  }

  // ۷) پیش‌فرض — چت‌بات خنگ و شوخ
  const intent = detectIntent(text);
  await api.sendChatAction({ chat_id: uid, action: 'typing' });
  const reply = await smartReply(uid, intent, { firstName: message.from.first_name });
  await api.sendMessage({ chat_id: uid, text: reply });
}
