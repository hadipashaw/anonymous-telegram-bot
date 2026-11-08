import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { blockedUsers, ownerStats } from '../schema.js';
import { getOrCreateCode } from './codes.js';

const BOT_USERNAME = 'YOUR BOT ID'; // بدون @

export function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔗 لینک من', callback_data: 'panel_link' }],
      [{ text: '🚫 بلاک‌شده‌ها', callback_data: 'panel_blocked' }],
      [{ text: '📊 آمار من', callback_data: 'panel_stats' }],
    ],
  };
}

export function backKeyboard() {
  return { inline_keyboard: [[{ text: '⬅️ برگشت', callback_data: 'panel_back' }]] };
}

export async function sendMainMenu(chatId) {
  await api.sendMessage({
    chat_id: chatId,
    text: '🎛 پنل مدیریت صندوق ناشناس\nیکی رو انتخاب کن:',
    reply_markup: mainMenuKeyboard(),
  });
}

export async function showLink(ownerId, chatId, messageId) {
  const code = await getOrCreateCode(ownerId);
  const link = `https://t.me/${BOT_USERNAME}?start=${code}`;
  await api.editMessageText({
    chat_id: chatId,
    message_id: messageId,
    text: `این لینک ناشناس توئه 👇\nهرکی روش بزنه می‌تونه بدون شناخته شدن بهت پیام بده:\n\n${link}`,
    reply_markup: backKeyboard(),
  });
}

export async function showBlocked(ownerId, chatId, messageId) {
  const rows = await db.select().from(blockedUsers).where(eq(blockedUsers.ownerId, ownerId)).all();

  if (rows.length === 0) {
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: '🚫 لیست بلاک‌شده‌ها خالیه.',
      reply_markup: backKeyboard(),
    });
    return;
  }

  // توجه: اینجا هیچ آیدی عددی واقعی تلگرام نشون داده نمی‌شه، فقط شماره‌ی ردیف داخلی خودمون
  const buttons = rows.map((r, i) => [
    { text: `آنبلاک کاربر #${i + 1}`, callback_data: `unblock_${r.id}` },
  ]);
  buttons.push([{ text: '⬅️ برگشت', callback_data: 'panel_back' }]);

  await api.editMessageText({
    chat_id: chatId,
    message_id: messageId,
    text: `🚫 ${rows.length} نفر بلاک شدن:`,
    reply_markup: { inline_keyboard: buttons },
  });
}

export async function showStats(ownerId, chatId, messageId) {
  const stat = await db.select().from(ownerStats).where(eq(ownerStats.ownerId, ownerId)).get();
  const blockedCount = await db.$count(blockedUsers, eq(blockedUsers.ownerId, ownerId));

  await api.editMessageText({
    chat_id: chatId,
    message_id: messageId,
    text: `📊 آمار تو:\n📬 پیام ناشناس دریافتی: ${stat ? stat.receivedCount : 0}\n🚫 بلاک‌شده: ${blockedCount}`,
    reply_markup: backKeyboard(),
  });
}
