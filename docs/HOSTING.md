# 🌐 استضافة DealBox مجاناً — الدليل الكامل

الخطة المجانية الموصى بها (كلها HTTPS ومجانية):

| الطبقة | الخدمة | الخطة المجانية |
|---|---|---|
| قاعدة البيانات | **MongoDB Atlas** (M0) | 512MB مجاناً دائماً |
| الخادم الخلفي (API) | **Render** | مجاني (ينام بعد 15 دقيقة خمول) |
| الموقع (واجهة) | **Vercel** | مجاني وسريع |

> ملاحظة: قاعدة البيانات المحلية المدمجة (`mongodb-memory-server`) للتجربة على جهازك فقط —
> في الاستضافة **يجب** استخدام Atlas وإلا ستفقد كل البيانات عند إعادة التشغيل.

---

## الخطوة 1: رفع المشروع إلى GitHub

1. ثبّت [Git](https://git-scm.com/download/win) ثم نفّذ من مجلد المشروع:
```bash
git init
git add .
git commit -m "DealBox Oman - ready for hosting"
```
2. أنشئ مستودعاً جديداً (خاص أو عام) في [github.com/new](https://github.com/new)
3. اربط وادفع:
```bash
git remote add origin https://github.com/USERNAME/dealbox-oman.git
git branch -M main
git push -u origin main
```

---

## الخطوة 2: قاعدة البيانات — MongoDB Atlas (مجاني)

1. سجّل في [mongodb.com/atlas](https://www.mongodb.com/atlas) (مجاني)
2. أنشئ Cluster جديد → اختر **M0 Free** → أي منطقة قريبة (مثل البحرين `me-south-1` إن توفرت)
3. **Database Access** → Add User → اسم + كلمة مرور قوية → احفظهما
4. **Network Access** → Add IP → اختر **Allow from Anywhere `0.0.0.0/0`** (ضروري لأن Render يغيّر عناوينه)
5. **Connect → Drivers → Node.js** → انسخ رابط الاتصال:
```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/dealbox_oman
```
استبدل `<user>` و`<password>` بقيمك الحقيقية.

---

## الخطوة 3: الخادم الخلفي — Render (مجاني)

1. سجّل في [render.com](https://render.com) بحساب GitHub
2. **New → Blueprint** → اختر مستودع `dealbox-oman` (ملف `render.yaml` يضبط كل شيء)
3. عند الطلب عبّئ:
   - `MONGO_URI` → رابط Atlas من الخطوة 2
   - `FRONTEND_URL` → ضع مؤقتاً `https://temp.vercel.app` (ستحدّثه بعد الخطوة 4)
   - `JWT_SECRET` → يُولّد تلقائياً
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` → لإشعارات Web Push (ولّدها بـ `npx web-push generate-vapid-keys --json`). اختيارية: بدونها تُتخطّى الإشعارات بهدوء.
   - `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` → لإشعارات تطبيق الجوال (FCM). اختيارية: بدونها تُتخطّى إشعارات التطبيق. القيم من Firebase → Project settings → Service accounts → Generate new private key (انظر `mobile/README.md`).
4. اضغط **Apply** وانتظر البناء (~3 دقائق)
5. انسخ رابط الخدمة، سيكون شكله: `https://dealbox-api-xxxx.onrender.com`
6. تحقق أنه يعمل: افتح `https://dealbox-api-xxxx.onrender.com/api/health` — يجب أن ترى `"status":"ok"`

---

## الخطوة 4: الموقع — Vercel (مجاني)

1. سجّل في [vercel.com](https://vercel.com) بحساب GitHub
2. **Add New → Project** → اختر مستودع `dealbox-oman`
   - إذا ظهرت شاشة خدمات متعددة (monorepo): استورد خدمة **`app` (Vite)** فقط — الخادم يعمل على Render
3. **قبل الضغط على Deploy**: أضف متغير البيئة (Settings تظهر بعد الاستيراد، أو من صفحة الإعداد قبل النشر):
   - `VITE_API_URL` = رابط خدمة Render (مثل `https://dealbox-oman-kbr5.onrender.com`)
   - `VITE_MAPBOX_TOKEN` = مفتاح خريطة Mapbox (لصفحة الخريطة في التطبيق)
   > الواجهة تنادي الخادم مباشرة بهذا الرابط (معترض `fetch` في `src/main.tsx`)،
   > والخادم يسمح بنطاق Vercel عبر CORS — لذلك لا تعتمد على `rewrites` في `vercel.json`
   > (تبقى كاحتياط فقط).
4. اضغط **Deploy** — سيبني تلقائياً (`npm run build` → `dist/public`)
5. ستحصل على رابط مثل: `https://dealbox-oman.vercel.app`
6. ارجع إلى Render وحدّث متغير `FRONTEND_URL` إلى رابط Vercel ثم **Manual Deploy**

---

## الخطوة 5: بذر البيانات على الاستضافة

من لوحة Render → خدمة `dealbox-api` → تبويب **Shell** نفّذ بالترتيب:
```bash
npm run bootstrap:admin      # إنشاء أول حساب أدمن
npm run db:seed              # الصناديق التجريبية
npm run db:seed:admin-team   # فريق المشرفين (كلمة المرور DemoAdmin123)
npm run db:seed:store-demo   # حساب المتجر الديمو
npm run db:seed:story-qa     # بيانات فحص القصص
npm run db:seed:marketing    # المحتوى التسويقي الافتراضي
```

---

## الخطوة 6: ربط تطبيق الجوال

حدّث رابط التطبيق في `mobile/android/.../res/values/strings.xml`:
```xml
<string name="webapp_url">https://dealbox-oman.vercel.app/?portal=client</string>
```
(استبدل بالرابط الحقيقي) — وفي النسخة النهائية أوقف `usesCleartextTraffic`
لأن الإنتاج يعمل بـ HTTPS فقط.

---

## ⚠️ قيود الخطة المجانية (مهم)

| القيد | التفاصيل |
|---|---|
| **نوم الخادم** | Render المجاني ينام بعد 15 دقيقة خمول — أول طلب بعده يستغرق ~60 ثانية (طبيعي ومقبول للتجربة) |
| **الصور المرفوعة** | قرص Render المجاني **مؤقت** — فعّل التخزين الخارجي (القسم التالي) وإلا قد تختفي الشعارات بعد إعادة التشغيل |
| **حجم القاعدة** | Atlas M0 = 512MB — كافٍ لآلاف المتاجر والطلبات |
| **نطاق Vercel** | مجاني مع نطاق `*.vercel.app` — يمكن ربط دومين خاص لاحقاً |

## بدائل مجانية أخرى
- الواجهة: Netlify أو Cloudflare Pages (نفس فكرة Vercel)
- الخلفية: Railway (رصيد تجريبي) أو Fly.io (حصة مجانية) — لكن Render أبسط مع `render.yaml` الجاهز

---

## الخطوة 7 (مهمة): التخزين الخارجي الدائم — Cloudinary (مجاني)

بدون هذه الخطوة، الشعارات والصور المرفوعة تُحفظ على قرص Render المؤقت وقد **تختفي**
بعد إعادة التشغيل. Cloudinary يمنحك تخزيناً دائماً مع CDN مجاناً (25GB — بدون بطاقة بنكية).

### 1. إنشاء الحساب
1. سجّل مجاناً في [cloudinary.com](https://cloudinary.com/users/register_free)
2. من لوحة التحكم (Dashboard) انسخ ثلاث قيم:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → اضغط Reveal وانسخه → `CLOUDINARY_API_SECRET`

### 2. تفعيله على Render
1. لوحة Render → خدمة `dealbox-api` → تبويب **Environment**
2. أضف المتغيرات الثلاثة والصق قيمها → **Save Changes**
3. ستُعاد الخدمة تلقائياً — راقب السجلات (Logs) حتى ترى:
```
[DealBox Uploads] التخزين الخارجي مفعّل (Cloudinary)
```

### 3. كيف يعمل؟
- **مفعّل**: كل صورة تُرفع إلى Cloudinary فوراً ويُحفظ رابط CDN دائم
  (`https://res.cloudinary.com/...`) في قاعدة البيانات — يبقى للأبد ويعمل من أي مكان
- **غير مفعّل** (التطوير المحلي): يبقى الرفع على القرص المحلي كما كان — لا شيء يتغير عندك
- الواجهة تعرض الرابطين بنفس الطريقة — **لا حاجة لأي تعديل في التطبيق**

### 4. التحقق
ارفع شعار متجر من لوحة الآدمن → يجب أن يبدأ الرابط المحفوظ بـ
`https://res.cloudinary.com/` بدل `/uploads/...`.
