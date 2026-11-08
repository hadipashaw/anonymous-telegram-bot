import { api, db } from 'sdk';
import { pendingReplies } from '../schema.js';
import { isBlocked, blockUser, unblockByRowId } from '../lib/blocks.js';
import { mainMenuKeyboard, showLink, showBlocked, showStats } from '../lib/panel.js';

export default async function (callbackQuery) {
  const data = callbackQuery.data ?? '';
  const ownerId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;

  // ---------- دکمه‌ی Reply (روی پیام فوروارد‌شده) ----------
  if (data.startsWith('reply_')) {
    const senderId = parseInt(data.replace('reply_', ''), 10);

    if (await isBlocked(ownerId, senderId)) {
      await api.answerCallbackQuery({
        callback_query_id: callbackQuery.id,
        text: 'این کاربر بلاک شده ❌',
        show_alert: true,
      });
      return;
    }

    await db.insert(pendingReplies)
      .values({ ownerId, targetId: senderId })
      .onConflictDoUpdate({ target: pendingReplies.ownerId, set: { targetId: senderId } })
      .run();

    await api.sendMessage({ chat_id: ownerId, text: 'پیامتو بنویس تا ناشناس برایش ارسال شود 😎' });
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id });
    return;
  }

  // ---------- دکمه‌ی Block (روی پیام فوروارد‌شده) ----------
  if (data.startsWith('block_')) {
    const senderId = parseInt(data.replace('block_', ''), 10);
    await blockUser(ownerId, senderId);

    await api.answerCallbackQuery({
      callback_query_id: callbackQuery.id,
      text: 'کاربر بلاک شد ✅',
      show_alert: true,
    });

    await api.editMessageReplyMarkup({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] },
    });
    return;
  }

  // ---------- پنل: برگشت به منوی اصلی ----------
  if (data === 'panel_back') {
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: '🎛 پنل مدیریت صندوق ناشناس\nیکی رو انتخاب کن:',
      reply_markup: mainMenuKeyboard(),
    });
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id });
    return;
  }

  // ---------- پنل: لینک من ----------
  if (data === 'panel_link') {
    await showLink(ownerId, chatId, messageId);
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id });
    return;
  }

  // ---------- پنل: بلاک‌شده‌ها ----------
  if (data === 'panel_blocked') {
    await showBlocked(ownerId, chatId, messageId);
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id });
    return;
  }

  // ---------- پنل: آمار من ----------
  if (data === 'panel_stats') {
    await showStats(ownerId, chatId, messageId);
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id });
    return;
  }

  // ---------- پنل: آنبلاک کردن یه ردیف از لیست ----------
  if (data.startsWith('unblock_')) {
    const rowId = parseInt(data.replace('unblock_', ''), 10);
    await unblockByRowId(ownerId, rowId);
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: 'آنبلاک شد ✅' });
    await showBlocked(ownerId, chatId, messageId);
  }
}
