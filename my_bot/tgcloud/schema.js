import { table, integer, text, json, unique, index, sql } from 'sdk/db';

// چت ناشناس فعال: فرستنده‌ای که در حال گفتگو با یه owner هست
export const activeChats = table('active_chats', {
  senderId: integer('sender_id').primaryKey(),
  ownerId: integer('owner_id').notNull(),
});

// کاربرهایی که یه owner بلاک کرده
export const blockedUsers = table('blocked_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull(),
  senderId: integer('sender_id').notNull(),
}, (t) => ({
  uq: unique('uq_owner_sender').on(t.ownerId, t.senderId),
}));

// owner در حال نوشتن جواب برای کدوم sender هست (معادل FSM در نسخه‌ی پایتون)
export const pendingReplies = table('pending_replies', {
  ownerId: integer('owner_id').primaryKey(),
  targetId: integer('target_id').notNull(),
});

// آخرین چند جواب شوخی که برای هر کاربر فرستاده شده (برای جلوگیری از تکرار)
export const replyHistory = table('reply_history', {
  userId: integer('user_id').primaryKey(),
  history: json('history').notNull().default(sql`'[]'`),
});

// کد کوتاه و تصادفی هر owner برای لینک ناشناس — جایگزین آیدی عددی خام توی لینک
export const inviteCodes = table('invite_codes', {
  code: text('code').primaryKey(),
  ownerId: integer('owner_id').notNull(),
}, (t) => ({
  ownerIdx: index('idx_invite_owner').on(t.ownerId),
}));

// آمار هر owner — برای بخش «آمار من» توی پنل
export const ownerStats = table('owner_stats', {
  ownerId: integer('owner_id').primaryKey(),
  receivedCount: integer('received_count').notNull().default(0),
});
