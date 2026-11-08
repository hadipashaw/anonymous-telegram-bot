import { db } from 'sdk';
import { eq } from 'sdk/db';
import { replyHistory } from '../schema.js';
import { RESPONSES } from './intent.js';

const MAX_HISTORY = 4;

// context.firstName (اختیاری) برای جایگزینی {name} توی بعضی جواب‌های greet استفاده می‌شه
export async function smartReply(userId, intent, context = {}) {
  const options = RESPONSES[intent];

  const row = await db.select().from(replyHistory).where(eq(replyHistory.userId, userId)).get();
  const history = row ? row.history : [];

  // قالب خام (با {name}) انتخاب و توی تاریخچه ذخیره می‌شه، نه نسخه‌ی شخصی‌سازی‌شده —
  // این‌طوری اگه اسم فرق کنه هم تشخیص تکراری بودن درست کار می‌کنه
  let template = options[Math.floor(Math.random() * options.length)];
  let tries = 0;
  while (history.includes(template) && tries < 10) {
    template = options[Math.floor(Math.random() * options.length)];
    tries += 1;
  }

  const newHistory = [...history, template].slice(-MAX_HISTORY);

  await db.insert(replyHistory)
    .values({ userId, history: newHistory })
    .onConflictDoUpdate({ target: replyHistory.userId, set: { history: newHistory } })
    .run();

  const name = context.firstName || 'رفیق';
  return template.replaceAll('{name}', name);
}
