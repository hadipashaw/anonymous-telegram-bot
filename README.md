# ربات ناشناس تلگرام (Anonymous Telegram Bot)

یه بات تلگرام برای پیام‌رسانی ناشناس، روی [Telegram Serverless](https://core.telegram.org/bots/serverless) —
هر کاربر یه لینک دعوت کوتاه می‌گیره، هر کسی باهاش پیام بفرسته ناشناس برای صاحب لینک فوروارد می‌شه،
و وقتی کسی بیرون از یه گفتگوی ناشناس پیام بده، یه چت‌بات شوخ و خنگ جوابش رو می‌ده.

## ویژگی‌ها

- **پیام‌رسانی ناشناس** با لینک دعوت کوتاه (کد تصادفی ۸ کاراکتری، بدون افشای آیدی عددی تلگرام)
- **بلاک/آنبلاک** فرستنده‌ها
- **پنل مدیریت** (`/panel`): لینک من، لیست بلاک‌شده‌ها (با آنبلاک تکی)، آمار پیام‌های دریافتی
- **پایان گفتگو** با `/end`
- **چت‌بات شوخ پیش‌فرض**: تشخیص نیت با امتیازدهی روی چند ده کلیدواژه (ریاضی، برنامه‌نویسی، فلسفه، احوال‌پرسی، خداحافظی، ناراحتی، عصبانیت، توهین، عشق، بی‌حوصلگی، تعریف) و بانک جواب‌های متنوع با شخصی‌سازی اسم

## ساختار پروژه

```
my_bot/tgcloud/
├─ schema.js              # جدول‌های دیتابیس
├─ lib/
│  ├─ blocks.js            # مدیریت بلاک/آنبلاک
│  ├─ codes.js             # ساخت و resolve کردن کد دعوت کوتاه
│  ├─ intent.js            # تشخیص نیت + بانک جواب‌های شوخ
│  ├─ panel.js             # نماهای پنل مدیریت
│  └─ smartReply.js        # انتخاب جواب با جلوگیری از تکرار
└─ handlers/
   ├─ message.js           # مسیریابی اصلی: /link, /panel, /end, /start, فوروارد پیام
   └─ callback_query.js    # دکمه‌های Reply/Block و پنل
```

> این ریپو فقط فایل‌های منطق بات (پوشه‌ی `tgcloud/`) رو داره، نه یه پروژه‌ی کامل و قابل‌اجرا به‌تنهایی.
> برای اجرا باید یه اسکلت پروژه با CLI خود تگ‌کلود بسازی و این فایل‌ها رو جایگزینش کنی (مرحله‌ی ۴ پایین).

## ⚙️ قبل از اجرا: جایگزین کردن آیدی بات (۲ جا)

دو فایل زیر فعلاً یه placeholder دارن که باید با یوزرنیم واقعی باتت (بدون `@`) جایگزین بشه:

- `my_bot/tgcloud/handlers/message.js`
- `my_bot/tgcloud/lib/panel.js`

توی هر دو این خط رو پیدا کن:

```js
const BOT_USERNAME = 'YOUR BOT ID'; // بدون @
```

و مقدارش رو با یوزرنیم واقعی بات عوض کن، مثلاً اگه بات `@NAMMEH_RESAN_BOT` باشه:

```js
const BOT_USERNAME = 'NAMMEH_RESAN_BOT';
```

این مقدار فقط برای ساختن لینک دعوت (توی `/link` و بخش «لینک من» توی پنل) استفاده می‌شه.

## 🚀 نحوه‌ی اجرا

1. **ساخت بات** (اگه قبلاً نساختی): با [@BotFather](https://t.me/BotFather) → `/newbot`.
   مستندات: [راهنمای BotFather](https://core.telegram.org/bots/features#botfather)

2. **فعال کردن Serverless روی بات**: `@BotFather` → بات موردنظر → **Serverless** → **Turn on**.
   مستندات: [Telegram Serverless](https://core.telegram.org/bots/serverless)

3. **کلون کردن این ریپو:**
   ```bash
   git clone https://github.com/hadipashaw/anonymous-telegram-bot.git
   ```

4. **ساخت اسکلت پروژه‌ی تگ‌کلود** (چون این ریپو فقط فایل‌های منطق رو داره، نه `package.json` و تنظیمات پروژه):
   ```bash
   npm create @tgcloud/bot my_bot
   ```
   بعد پوشه‌ی `tgcloud/` تازه‌ساخته‌شده رو با پوشه‌ی `my_bot/tgcloud/` همین ریپو جایگزین کن (overwrite).

5. **اتصال پروژه به بات:**
   ```bash
   cd my_bot
   npx tgcloud login
   ```
   توکن رو از `@BotFather` → بات → **Serverless** → **CLI Access** → **Access token** بگیر و پیست کن.

6. **دیپلوی:**
   ```bash
   npx tgcloud push
   npx tgcloud migrate
   ```

7. **ثبت دستورها** توی `@BotFather` → بات → **Edit Commands**:
   ```
   link - دریافت لینک ناشناس من
   panel - پنل مدیریت صندوق ناشناس
   end - پایان گفتگوی ناشناس فعلی
   ```

## 📚 منابع رسمی تلگرام

- [Telegram Serverless](https://core.telegram.org/bots/serverless) — مستندات کامل پلتفرم Serverless و CLI
- [راهنمای BotFather](https://core.telegram.org/bots/features#botfather) — ساخت بات و مدیریت تنظیماتش
- [Telegram Bot API](https://core.telegram.org/bots/api) — مرجع کامل متدها و آبجکت‌های Bot API


## 🤖 ربات ناشناس ما در تلگرام برای تست :
 ربات تلگرام ما :
-[telegram bot | ربات تلگرام](https://t.me/NAMMEH_RESAN_BOT)
