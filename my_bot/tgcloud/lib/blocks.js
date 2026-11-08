import { db } from 'sdk';
import { and, eq } from 'sdk/db';
import { blockedUsers } from '../schema.js';

export async function isBlocked(ownerId, senderId) {
  const row = await db.select().from(blockedUsers)
    .where(and(eq(blockedUsers.ownerId, ownerId), eq(blockedUsers.senderId, senderId)))
    .get();
  return !!row;
}

export async function blockUser(ownerId, senderId) {
  if (await isBlocked(ownerId, senderId)) return;
  await db.insert(blockedUsers).values({ ownerId, senderId }).run();
}

// برای دکمه‌ی Unblock توی پنل — با id داخلی ردیف کار می‌کنه نه آیدی تلگرام،
// و ownerId رو هم چک می‌کنه که یه owner نتونه ردیفِ owner دیگه رو حذف کنه
export async function unblockByRowId(ownerId, rowId) {
  await db.delete(blockedUsers)
    .where(and(eq(blockedUsers.id, rowId), eq(blockedUsers.ownerId, ownerId)))
    .run();
}
