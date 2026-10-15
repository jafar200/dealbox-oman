# 📱 تطبيق DealBox عُمان — نسخة WebView للجوال

التطبيق هو **غلاف WebView متكامل** يحمّل موقع DealBox (تطبيق الزبون) مباشرة — أي تغيير يُنشر على الموقع يظهر في التطبيق فوراً بدون إعادة رفع.

```
mobile/
├── android/   ← مشروع Gradle جاهز للفتح في Android Studio (جوجل بلاي)
├── ios/       ← ملفات Swift + Info.plist لمشروع Xcode (آب ستور)
└── README.md  ← هذا الدليل
```

---

## 🔗 أولاً: ربط التطبيق بالموقع

التطبيق يحمّل رابطاً واحداً — عدّله **قبل البناء**:

| البيئة | الرابط | المكان |
|---|---|---|
| تجربة محلية (محاكي Android) | `http://10.0.2.2:3000/?portal=client` | `android/app/src/main/res/values/strings.xml` → `webapp_url` |
| تجربة محلية (جهاز حقيقي) | `http://<IP-جهازك>:3000/?portal=client` | نفس المكان (أندرويد) / `WebViewController.swift` → `startURL` (آيفون) |
| **إنتاج** | `https://دومينك.com/?portal=client` | نفس المكانين |

⚠️ **مطلوب للنشر**: موقع منشور على **دومين حقيقي مع HTTPS** (مثل `https://dealbox.om`).
الواجهة الخلفية (API) يجب أن تكون على **نفس الدومين** (بروكسي عكسي مثل Nginx يوجّه `/api/*` إلى الخادم على المنفذ 5001) لأن التطبيق يستدعي `/api/v1/...` بمسارات نسبية.

---

## 🤖 أندرويد (Google Play)

### المتطلبات
- [Android Studio](https://developer.android.com/studio) (مجاني) على ويندوز أو ماك
- حساب مطوّر في Google Play Console (رسوم لمرة واحدة **25$**)

### الخطوات
1. افتح Android Studio → **Open** → اختر مجلد `mobile/android`
2. انتظر مزامنة Gradle (يحمّل المكتبات تلقائياً)
3. عدّل `webapp_url` في `strings.xml` (انظر الجدول أعلاه)
4. للتجربة: شغّل على محاكي (AVD) أو جهاز موصول بـ USB — يعمل فوراً
5. للنشر: **Build → Generate Signed Bundle / APK**
   - أنشئ **Keystore** جديداً (احفظه وكلمة السر بأمان — لا يمكن تغييره لاحقاً)
   - اختر **Android App Bundle (.aab)** — هذا هو الملف المرفوع للمتجر
6. ارفع ملف `.aab` في [Google Play Console](https://play.google.com/console):
   - إنشاء تطبيق جديد → اسم **DealBox عُمان** → الفئة: «تسوق» أو «طعام ومشروبات»
   - املأ صفحة المتجر: وصف + لقطات شاشة (من الموقع) + أيقونة 512×512
   - ارفع الـ AAB → أكمل نماذج الخصوصية والامتثال → **إرسال للمراجعة**
7. المراجعة عادة 1–7 أيام.

### ملاحظات أندرويد مهمة
- `minSdk 26` (Android 8.0+) — يغطي أكثر من 95% من الأجهزة
- للإنتاج: استخدم HTTPS وأوقف `usesCleartextTraffic` في `AndroidManifest.xml` (واحذف `network_security_config.xml` أو اجعله يمنع HTTP)
- الأيقونة التكيفية (Vector) موجودة — لاستبدالها بأيقونة PNG احترافية ضعها في `mipmap-*/`

### 🔔 إشعارات الهاتف داخل التطبيق (Firebase FCM)
الإشعارات التي تظهر على **شاشة القفل** حتى لو التطبيق مغلق أو الهاتف في وضع السكون تحتاج Firebase. بدونها يعمل التطبيق عادي لكن لا تصله إشعارات نظام (Web Push لا يعمل داخل WebView).

**الخطوات (مرة واحدة):**
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (أو اختر مشروع Google Cloud الموجود).
2. في المشروع → **Add app** → **Android**:
   - Package name: `om.dealbox.app`
   - أدخل **SHA-1** الخاص بمفتاح التوقيع (انظر «استخراج بصمة SHA-1» أدناه — أضف sha1 الخاص بـ debug و release).
3. نزّل **`google-services.json`** وضعه في: `mobile/android/app/google-services.json`
   > الملف اختياري: وجوده يفعّل الإشعارات تلقائياً، وغيابه يُبقي البناء سليماً بدون FCM.
4. في Firebase → ⚙️ **Project settings → Service accounts → Generate new private key** (ملف JSON).
   انسخ منه إلى متغيّرات بيئة **Render**:
   - `FIREBASE_PROJECT_ID` = `project_id`
   - `FIREBASE_CLIENT_EMAIL` = `client_email`
   - `FIREBASE_PRIVATE_KEY` = `private_key` (سطر واحد مع `\n` بدل الأسطر)
5. أعد بناء التطبيق (Android Studio → Build) وارفع نسخة جديدة للمتجر.
6. افتح التطبيق → سيطلب **صلاحية الإشعارات** → اقبل. الآن كل تنبيه عام ينشره الأدمن سيظهر كإشعار نظام.

> **آيفون:** نفس مشروع Firebase يخدم iOS أيضاً عبر APNs (يحتاج مفتاح APNs من Apple Developer + مشروع Xcode). حالياً على آيفون يعمل **Web Push** من Safari عند «إضافة إلى الشاشة الرئيسية» (iOS 16.4+) بدون Firebase.

### ⚠️ مشاكل بناء شائعة في Android Studio
- **`Unsupported class file major version 69`** أو «Java غير متوافق»: Android Studio يستخدم JDK أحدث مما يدعمه Gradle الحالي (Java 25 يحتاج Gradle 9.1+).
  الحل: **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** → اختر **JDK 17** (أو Download JDK → 17) → Apply ثم Sync.
- **`File google-services.json is missing`**: الملف **اختياري** في هذا المشروع — يُطبَّق تلقائياً عند وجوده فقط، فلا يفترض ظهور هذا الخطأ.

---


## 🔐 تسجيل الدخول عبر Google داخل التطبيق (أصلي / Native)

**المشكلة:** Google يحظر تسجيل الدخول داخل WebView (نافذة منبثقة + سياسة أمنية)، فيظهر الزر لكن لا يعمل.
**الحل المطبّق:** التطبيق يستخدم **Google Sign-In الأصلي** (play-services-auth) ويمرّر رمز الهوية للواجهة عبر جسر جافاسكربت، ثم تُكمل الواجهة الدخول عبر الخادم (`/api/v1/auth/google`).

### كيف يعمل (المسار)
```
زر Google في الموقع (ClientAuthView)
  → window.AndroidGoogle.signIn(clientId)         ← جسر أندرويد في MainActivity.java
  → مُنتقي حساب Google الأصلي (من النظام)
  → idToken يُعاد للواجهة: window.__dealboxGoogleNativeToken(idToken)
  → authenticateGoogle() → POST /api/v1/auth/google
  → إنشاء جلسة عميل + دخول
```
> في المتصفح العادي يبقى المسار القديم (Google Identity Services + نافذة منبثقة) كما هو.

### الإعداد المطلوب في Google Cloud Console (مرة واحدة)
1. [console.cloud.google.com](https://console.cloud.google.com) → أنشئ مشروعاً (أو اختر الموجود).
2. **APIs & Services → OAuth consent screen** → External → املأ اسم التطبيق والبريد → Save.
3. **Credentials → Create credentials → OAuth client ID**:
   - **أولاً: نوع Web application** ← هذا هو `GOOGLE_CLIENT_ID` (نفسه للخادم والواجهة).
     - Authorized JavaScript origins: `https://dealbox-oman.vercel.app`
     - انسخ الـ Client ID (ينتهي بـ `.apps.googleusercontent.com`).
   - **ثانياً: نوع Android** ← لتفعيل الأصلي:
     - Package name: `om.dealbox.app`
     - SHA-1: بصمة مفتاح التوقيع (انظر أدناه)
4. **قيم البيئة المطابقة:**
   - في التطبيق: ضع الـ Web Client ID في `mobile/android/app/src/main/res/values/strings.xml` →
     `google_web_client_id` (احتياطي يعمل حتى لو لم تُضبط الواجهة).
   - على **Render**: أضف `GOOGLE_CLIENT_ID` = نفس الـ Web Client ID ثم أعد النشر.
   - على **Vercel**: أضف `VITE_GOOGLE_CLIENT_ID` = نفس القيمة (لواجهة المتصفح).
   - في **لوحة الآدمن ← الموقع/الإعدادات ← Google Client ID**: نفس القيمة.
   > القيمة في `strings.xml` تكفي لعمل الزر في التطبيق؛ الباقي مطلوب لتسجيل الدخول من المتصفح.

### استخراج بصمة SHA-1
```powershell
# مفتاح التطوير (للمحاكي وتجربة USB):
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v `
  -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey `
  -storepass android -keypass android
```
انسخ قيمة **SHA1** وأضفها في خطوة «Android client ID».
> للنسخة النهائية أضف أيضاً SHA-1 الخاص بـ **keystore الإصدار** الذي أنشأته وقت التوقيع (`Generate Signed Bundle`)، لأن بصمته تختلف.
> إن ظهر رمز الخطأ 10 عند تسجيل الدخول فمعناه أن SHA-1 أو اسم الحزمة غير مطابق.

### الملفات المعنية
- `mobile/android/app/src/main/java/om/dealbox/app/MainActivity.java` — الجسر الأصلي `AndroidGoogle`.
- `mobile/android/app/build.gradle` — مكتبة `play-services-auth`.
- `src/components/ClientAuthView.tsx` — كشف الجسر `isNativeApp` وربط الأزرار.

---

## 🍎 iOS (App Store)

### المتطلبات
- جهاز **ماك** + [Xcode](https://developer.apple.com/xcode/) (مجاني)
- حساب Apple Developer (**99$/سنة**)

### الخطوات
1. Xcode → **Create New Project** → iOS → **App** → Interface: **Storyboard**، Language: **Swift**
   - Product Name: `DealBox Oman` — Bundle Identifier: `om.dealbox.app`
2. احذف `SceneDelegate.swift` (التطبيق يستخدم AppDelegate فقط)
3. استبدل محتوى `AppDelegate.swift` و`ViewController.swift` بالملفين في `mobile/ios/`
   (أعد تسمية `WebViewController.swift` إلى `ViewController.swift` أو عدّل الاسم في AppDelegate)
4. انسخ مفاتيح `mobile/ios/Info.plist` إلى `Info.plist` الخاص بالمشروع
5. عدّل `startURL` في `WebViewController.swift`
6. في Signing & Capabilities: اختر **Team** (حسابك المدفوع)
7. **Product → Archive** → **Distribute App** → **App Store Connect** → رفع
8. أكمل صفحة التطبيق في App Store Connect (لقطات + وصف + سياسة خصوصية) → **إرسال للمراجعة**

### 🔔 إشعارات الآيفون — الوضع الحالي
- **بدون حساب Apple (يعمل الآن، مجاناً):** إشعارات **Web Push** تظهر على شاشة القفل حتى والتلفون نايم، بشرط أن يضيف المستخدم الموقع من **Safari** عبر **مشاركة → إضافة إلى الشاشة الرئيسية** (iOS 16.4+)، ثم يقبل الإشعارات. هذا مبني ومنشور بالفعل.
- **تطبيق iOS أصلي (يحتاج ماك + 99$/سنة):** لإشعارات FCM داخل التطبيق:
  1. في Firebase → **Add app → iOS** → Bundle ID: `om.dealbox.app` → نزّل `GoogleService-Info.plist` وأضفه للمشروع.
  2. أضف Firebase SDK عبر Swift Package Manager (`firebase-ios-sdk`) → منتج **FirebaseMessaging**.
  3. في Xcode → Signing & Capabilities → أضف **Push Notifications** + **Background Modes → Remote notifications**.
  4. في Apple Developer → أنشئ **APNs Auth Key** وارفعه في Firebase → Project settings → Cloud Messaging.
  5. `Info.plist` يحتوي أصلاً على `UIBackgroundModes = remote-notification` (جاهز في `mobile/ios/Info.plist`).
  > نفس مفاتيح الخادم (`FIREBASE_*` على Render) تخدم أندرويد وiOS معاً.

---

## ✅ قائمة ما قبل النشر (كلا المتجرين)

- [ ] الموقع منشور على دومين HTTPS (لا localhost)
- [ ] `webapp_url` / `startURL` يشيران للإنتاج مع `?portal=client`
- [ ] Google Play: أيقونة 512×512 + لقطات شاشة + وصف + سياسة خصوصية
- [ ] App Store: لقطات iPhone + وصف + سياسة خصوصية + خانة «اتصال بالويب» موضّحة
- [ ] Keystore محفوظ (أندرويد) — بدونه لا يمكن تحديث التطبيق
- [ ] اختبار شامل على جهاز حقيقي: الحجز، كود الاستلام، التنبيهات، الدفع

---

## 🗺️ ملاحظة عن «جوجل ماب» (Google Maps)

إن كان قصدك **ظهور النشاط على خرائط جوجل** (وليس رفع التطبيق):
1. ادخل [Google Business Profile](https://business.google.com)
2. أضف نشاط «DealBox عُمان» — الفئة: «متجر بقالة / مخبوزات» — العنوان: الخوض، مسقط
3. هذا يظهر المتجر في نتائج الخرائط ويساعد زوار الموقع من الخوض ومسقط

(لوحة الآدمن تحتوي أصلاً على قسم «ربط خرائط جوجل» ضمن الإعدادات — المفتاح الحالي DEMO_KEY يُستبدل بمفتاح Google Maps Platform حقيقي عند توفره.)
