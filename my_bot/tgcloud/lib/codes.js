import { db } from 'sdk';
import { eq } from 'sdk/db';
import { inviteCodes } from '../schema.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 8;

// از Math.random به‌جای crypto.getRandomValues استفاده می‌کنیم چون در دسترس بودن Web Crypto
// توی این sandbox تأیید نشده؛ Math.random بخشی از خود جاوااسکریپته و همه‌جا هست.
// برای یه کد دعوت (نه یه رمز امنیتی حیاتی)، این سطح از تصادفی بودن کافیه.
function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

// هر owner فقط یه کد ثابت داره؛ اگه قبلاً ساخته شده همون برمی‌گرده (لینک عوض نمی‌شه)
export async function getOrCreateCode(ownerId) {
  const existing = await db.select().from(inviteCodes).where(eq(inviteCodes.ownerId, ownerId)).get();
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const clash = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code)).get();
    if (!clash) {
      await db.insert(inviteCodes).values({ code, ownerId }).run();
      return code;
    }
  }
  throw new Error('Could not generate a unique invite code');
}

// کد رو به آیدی owner واقعی تبدیل می‌کنه؛ اگه نامعتبر بود null برمی‌گردونه
export async function resolveCode(code) {
  const row = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code)).get();
  return row ? row.ownerId : null;
}
