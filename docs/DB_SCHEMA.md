# DealBox Oman - Database Schema Documentation (Mongoose & MongoDB)

## 📌 النظرة العامة (Overview)
تم تصميم قاعدة بيانات **DealBox** في سلطنة عُمان (محافظة مسقط / ولاية السيب / الخوض) لخدمة نموذج أعمال إنقاذ فائض الأطعمة من المخابز والمطاعم والمقاهي.

---

## 1. مخطط المستخدمين (`User.js`)
يدير حسابات المنصة مع تطبيق نظام الصلاحيات (RBAC).

| الحقل (Field) | النوع (Type) | الوصف (Description) |
|---|---|---|
| `name` | String | اسم المستخدم أو ممثل المتجر |
| `email` | String (Unique) | البريد الإلكتروني |
| `phone` | String | رقم الهاتف العماني (+968) |
| `password` | String | كلمة المرور المشفرة بـ bcrypt |
| `role` | Enum | `client` (زبون) \| `store_manager` (مسؤول متجر) \| `admin` (مدير نظام) |
| `storeId` | ObjectId | مرجع لمعرف المتجر (في حال كان مسؤول متجر) |
| `wilayah` | String | الولاية الافتراضية (مثال: السيب / الخوض) |
| `ecoScoreKgSaved` | Number | رصيد كجم الطعام المنقذ بيئياً |
| `active` | Boolean | حالة الحساب (مفعّل/موقوف) |
| `resetPasswordToken` | String (select: false) | رمز استعادة كلمة المرور مجزّأ SHA-256 (لربط «نسيت كلمة المرور») |
| `resetPasswordExpires` | Date | تاريخ انتهاء صلاحية رمز الاستعادة (30 دقيقة) |
| `adminRole` | Enum \| null | الدور داخل لوحة الآدمن المركزية (RBAC): `super_admin` \| `operations_manager` \| `supervisor` \| `logistics_manager` \| `financial_officer` \| `food_safety`. يُستخدم فقط لحسابات `role: 'admin'`؛ `null` تعني مدير عام افتراضياً (توافق) |
| `lastLoginAt` | Date \| null | آخر تسجيل دخول (يظهر في «آخر نشاط» بجدول فريق المشرفين) |

> الصلاحيات الفعلية لا تُخزَّن — تُشتق من `adminRole` عبر `backend/src/config/adminRoles.js` (مصدر الحقيقة الوحيد) وتُعاد في استجابة تسجيل الدخول كـ `permissions[]`.

---

## 2. مخطط المتاجر (`Store.js`)
بيانات المقاهي والمخابز الشريكة في الخوض والسيب وباقي ولايات مسقط.

| الحقل (Field) | النوع (Type) | الوصف (Description) |
|---|---|---|
| `name` | String | الاسم التجاري للمحل (مثل: مخبز مسقط النور) |
| `crNumber` | String | رقم السجل التجاري في وزارة التجارة والصناعة العمانية |
| `category` | Enum | `bakery`, `supermarket`, `restaurant`, `cafe`, `produce`, `cooked` |
| `wilayah` | Enum | السيب، بوشر، مطرح، العامرات، صحار، صلالة، نزوى، بركاء |
| `area` | String | المنطقة المحددة (الخوض، الحيل، الموالح، القرم...) |
| `coordinates` | Object `{lat, lng}` | خطوط الطول والعرض لعرضها على خريطة Leaflet |
| `commissionRate` | Number | نسبة عمولة منصة DealBox (افتراضياً 0.15 = 15%) |
| `bankDetails` | Object | اسم البنك العماني (مثل بنك مسقط) ورقم الآيبان (IBAN) |
| `status` | Enum | `active` \| `pending` \| `suspended` |

---

## 3. مخطط سلال المفاجآت (`Box.js`)
الصناديق اليومية المعروضة للزبائن بخصم يصل إلى 70%.

| الحقل (Field) | النوع (Type) | الوصف (Description) |
|---|---|---|
| `storeId` | ObjectId -> Store | المتجر التابع له |
| `title` | String | عنوان السلة (مثل: صندوق المخبوزات الطازجة) |
| `category` | Enum | نوع المأكولات |
| `originalPrice` | Number | السعر الأصلي بالريال العماني (ر.ع) |
| `discountedPrice` | Number | السعر المخفض بالريال العماني (ر.ع) |
| `remainingCount` | Number | عدد السلال المتبقية اليوم |
| `pickupStart` / `pickupEnd` | String | نافذة استلام الطلب (مثال: 20:00 - 21:30) |
| `active` | Boolean | حالة التوفر الحالية |

---

## 4. مخطط الطلبات وأكواد الاستلام (`Order.js`)
توثيق عمليات الشراء وكود الحجز السري.

| الحقل (Field) | النوع (Type) | الوصف (Description) |
|---|---|---|
| `orderNumber` | String (Unique) | رقم تسلسلي للطلب (مثل: `ORD-OM-2609-842`) |
| `bookingCode` | String (Unique) | كود استلام سري مكون من 4 أرقام يظهره الزبون للكاشير (مثل: `DB-8492`) |
| `clientId` | ObjectId -> User | حساب المشتري |
| `storeId` | ObjectId -> Store | المتجر المستلم |
| `pricePaidOmr` | Number | المبلغ المدفوع بالريال العماني |
| `platformCommissionOmr` | Number | عمولة المنصة المستقطعة تلقائياً (15%) |
| `storeNetPayoutOmr` | Number | صافي مستحق المتجر من البيع |
| `status` | Enum | `pending` (في انتظار الاستلام) \| `collected` (تم الاستلام والتحقق) \| `cancelled` |
| `collectedAt` | Date | وقت قيام كاشير المتجر بمسح/تأكيد الكود |

---

## 5. مخطط التسويات والتحويلات البنكية (`Settlement.js`)
التسويات المالية الأسبوعية وتحويل الأرباح لحسابات المتاجر العمانية.

| الحقل (Field) | النوع (Type) | الوصف (Description) |
|---|---|---|
| `settlementNumber` | String (Unique) | كود التسوية (مثل: `STL-OM-2026-042`) |
| `storeId` | ObjectId -> Store | المتجر المستحق |
| `totalOrdersCount` | Number | عدد الطلبات المكتملة في الدورة الأسبوعية |
| `grossSalesOmr` | Number | إجمالي المبيعات المحققة بالريال العماني |
| `platformCommissionOmr` | Number | إجمالي عمولة المنصة المقتطعة |
| `netPayoutOmr` | Number | صافي المبلغ المحول لحساب المتجر |
| `status` | Enum | `pending` \| `processed` \| `transferred` (تم التحويل البنكي) |

---

## 6. عقد واجهة قائمة الصناديق للزبون (`GET /api/v1/client/boxes`)

المسار يقرأ مباشرة من مخططَي `Box` و`Store` في MongoDB (لا توجد بيانات ثابتة في الكود):

- **الفلاتر (Query Params):** `category` (فئة الصندوق)، `wilayah` (ولاية المتجر)، `maxDistance` (أقصى مسافة بالكيلومتر)، `lat`/`lng` (إحداثيات الزبون لحساب المسافة، وافتراضياً الخوض `23.6139, 58.1963`).
- **شروط العرض:** `Box.active = true` و `Box.remainingCount > 0` و `Store.status = 'active'`.
- **حساب المسافة:** تُحسب بمعادلة Haversine بين نقطة الزبون وإحداثيات المتجر، والنتيجة مرتبة تصاعدياً حسب `distanceKm`.
- **حقول العناصر:** `id`, `storeId`, `storeName`, `storeLogoUrl`, `phone`, `address`, `rating`, `wilayah`, `area`, `category`, `title`, `description`, `imageUrl`, `expectedItems`, `originalPrice`, `discountedPrice`, `currency` (ر.ع), `remainingCount`, `pickupWindow`, `pickupDate`, `distanceKm`, `coordinates`, `createdAt`.
- **الاستجابة:** `{ success, count, currency, origin, data: [...] }`.
- **بيانات تجريبية:** تُضاف عبر `npm --prefix backend run db:seed` (idempotent — لا تكرر السجلات).

---

## 7. عقد عملية الحجز (`POST /api/v1/client/orders` و `GET /api/v1/client/orders`)

المساران محميّان بـ `protect` (يحتاجان `Authorization: Bearer <token>`) ويكتبان مباشرة في مخطط `Order`.

### `POST /api/v1/client/orders` — إنشاء حجز

- **الجسم (Body):** `{ boxId: ObjectId, quantity: number (1–20) }`.
- **التحقق من المدخلات:** `boxId` يجب أن يكون ObjectId صالح، و`quantity` عدد صحيح بين 1 و 20، وإلا `400`.
- **خصم المخزون ذرياً:** يُستخدم `Box.findOneAndUpdate({ _id, active: true, remainingCount: { $gte: quantity } }, { $inc: { remainingCount: -quantity } })` لمنع حجز نفس الصندوق مرتين في نفس اللحظة.
  - الصندوق غير موجود → `404`.
  - نفدت الكمية أو غير نشط → `409`.
  - المتجر بحالة غير `active` → `409` مع **إعادة** المخزون المخصوم.
- **التسعير يُحسب في الخادم فقط** (لا يُtrusted سعر العميل): `pricePaidOmr = discountedPrice × quantity`، `originalPriceOmr = originalPrice × quantity`، `platformCommissionOmr = pricePaidOmr × ENV.COMMISSION_RATE` (15%)، `storeNetPayoutOmr = pricePaidOmr − platformCommissionOmr`.
- **كود الاستلام:** يولّده الخادم عبر `generateBookingCode()` مع إعادة محاولة حتى 8 مرات عند تعارض الـ unique index على `bookingCode`.
- **في حال فشل الإنشاء:** يُعاد خصم المخزون (rollback)، وأخطاء `11000` تعود `409` و`ValidationError` تعود `400`.
- **الاستجابة:** `201` مع `{ success, message, data: serializeOrder(order) }` وحقول `orderNumber`, `bookingCode`, `pricePaid`, `originalPrice`, `platformCommissionOmr`, `storeNetPayoutOmr`, `pickupCode`, `pickupTimeWindow`, `status`.

### `GET /api/v1/client/orders` — طلبات الزبون

- يُرجع طلبات المستخدم الحالي فقط (`Order.find({ clientId: req.user._id })`) مرتّبة تنازلياً حسب التاريخ.
- **الاستجابة:** `{ success, count, orders: [...] }` بنفس شكل `serializeOrder`.

### جهة الاستدعاء في الواجهة

- `src/data/ordersApi.ts` يوفّر `createOrder(boxId, quantity)` و `fetchMyOrders({ signal })` ويقرأ التوكن من `dealbox_auth_token_v1`.
- `src/App.tsx` يستدعي `handleClaimBox` غير المتزامنة: عند النجاح يخصم الكمية من الحالة المحلية ويضيف الحجز، وعند الفشل يعرض رسالة الخطأ دون تعديل الحالة.

---

## 8. التنبيه العام للتطبيق (`PlatformSetting` + API)

تنبيه واحد عام ينشره الأدمن من لوحة الإعدادات ويظهر لكل المستفيدين على هواتفهم (بانر أعلى الرئيسية + بطاقة في نافذة التنبيهات + نقطة عدم قراءة على الجرس).

### التخزين (`PlatformSetting`)
تُخزَّن تحت مفتاح `key: 'announcement'` مع الحقول التالية:

| الحقل (Field) | النوع (Type) | الوصف (Description) |
|---|---|---|
| `announcementTitle` | String (≤120) | عنوان التنبيه |
| `announcementBody` | String (≤600) | نص التنبيه |
| `announcementActive` | Boolean | هل التنبيه منشور الآن |
| `announcementPublishedAt` | Date \| null | آخر لحظة نشر (يُحدَّث عند النشر/تغيير المحتوى ليصل كجديد) |

### `GET /api/v1/admin/announcement` (أدمن فقط)
يعيد حالة التنبيه الحالية: `{ announcementTitle, announcementBody, announcementActive, announcementPublishedAt }`.

### `PATCH /api/v1/admin/announcement` (أدمن فقط)
- **الجسم:** `{ announcementTitle, announcementBody, announcementActive }`.
- **التحقق:** النشر يطلب عنوان ونص غير فارغين (400)، حد أقصى 120/600 حرف.
- **النشر كجديد:** عند التفعيل بمحتوى جديد (أو أول نشر) يُضبط `announcementPublishedAt = now()` ليظهر التنبيه كنقطة عدم قراءة عند الجميع.
- **التحديثات:** `announcementActive: false` توقف العرض فوراً مع حفظ المحتوى كمسودة.

### `GET /api/v1/client/announcement` (عام — بدون تسجيل دخول)
مسار عام ليصل التنبيه لكل المستفيدين حتى خارج الجلسة. يعيد:
`{ success, announcement: { title, body, publishedAt } | null }` — null عندما لا يوجد تنبيه منشور.
- الواجهة تفحص المسار كل 30 ثانية (`src/App.tsx`) وتعالج عدم القراءة عبر `localStorage` بعلامة `dealbox_announcement_seen_v1` (تطابق `publishedAt`).
- لوحة الأدمن: `src/components/AdminAnnouncementSettings.tsx` (نشر / حفظ كمسودة / إيقاف العرض).

## 9. إحصائيات الأدمن الحقيقية (`GET /api/v1/admin/analytics` — أدمن فقط)

مسار يُرجع أرقامًا محسوبة مباشرة من قاعدة البيانات (أوامر `Orders` + متاجر `Stores`) بدلاً من أرقام ثابتة/وهمية. تستخدمه لوحة الأدمن العامة (`src/components/AdminDashboardView.tsx`) لعرض المبيعات اليومي/الأسبوعي والرسوم البيانية.

### الاستجابة
```json
{
  "success": true,
  "data": {
    "totalStores": 5,
    "activeStores": 5,
    "pendingStores": 0,
    "grossSalesOmr": 6.3,
    "platformCommissionOmr": 0.945,
    "mealsRescued": 4,
    "totalOrders": 3,
    "nonCancelledPct": 100,
    "todayStat": { "total": 0, "collected": 0, "pending": 0, "cancelled": 0 },
    "weekly": [
      { "day": "الأحد", "salesOmr": 0, "ordersCount": 0, "isPeak": false }
    ],
    "recentOrders": [
      {
        "id": "DB-4396",
        "storeName": "…",
        "beneficiary": "…",
        "beneficiaryNote": "…",
        "windowTime": "…",
        "status": "pending | collected | cancelled",
        "statusText": "…",
        "phone": "+968 …",
        "items": "…",
        "priceOmr": 1.5
      }
    ]
  }
}
```

### تعاريف الحقول
| الحقل | المصدر | الوصف |
|---|---|---|
| `totalStores` / `activeStores` / `pendingStores` | `Store.status` | عدد المتاجر الإجمالي والنشط وقيد الانضمام |
| `grossSalesOmr` | مجموع `Order.pricePaidOmr` | إجمالي مبيعات المتاجر الحقيقية (الطلبات غير الملغاة فقط) |
| `platformCommissionOmr` | مجموع `Order.platformCommissionOmr` | عمولة المنصة (15%) |
| `mealsRescued` | مجموع `Order.quantity` | إجمالي السلال/الوجبات المنقذة (غير الملغاة) |
| `totalOrders` / `nonCancelledPct` | `Order.status` | إجمالي الطلبات ونسبة غير الملغاة |
| `todayStat` | `Order.createdAt >= بداية اليوم` | طلبات اليوم مقسمة حسب الحالة |
| `weekly` | آخر 7 أيام من `Order.createdAt` | مبيعات الأيام السبعة الماضية بالريال + عدد الطلبات + ذروة الأسبوع |
| `recentOrders` | أحدث 6 طلبات | صفوف جدول "المتابعة اللحظية للحجوزات" |

### ملاحظات
- البيانات تُحسب لحظيًا عند كل طلب، لا توجد أرقام ثابتة.
- `weekly[].isPeak` يحدد أعلى يوم مبيعات في الأسبوع (يُبرز بالرسم البياني).
- `recentOrders[].status` بنفس قيم `Order.status` الثلاث (لا يقبل آخر).
- المبيعات تُعرض بالريال العماني (ر.ع) وليس بالكيلوجرام — الكيلوجرام الوهمي أُزيل من الرسم البياني.

## 10. تحليلات المستخدمين والحجوزات (`GET /api/v1/admin/users-analytics` — أدمن فقط)

مسار يخدم قسم «قائمة المستخدمين» في لوحة الأدمن وجدول «المتابعة اللحظية»: يُرجع لكل مستخدم (مسجّل أو زائر) عدد حجوزاته من كل متجر مع عدادات الفترات (اليوم / الأسبوع / الشهر / السنة)، ولكل متجر عدد حجوزاته ومن هم المستخدمون الحاجزون. البيانات لحظية من `Orders` + `User`.

### الاستجابة
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 5,
      "totalBookings": 3,
      "activeToday": 0,
      "totalStores": 2
    },
    "users": [
      {
        "clientId": "…",
        "clientName": "عميل تجريبي",
        "clientPhone": "+968 91111111",
        "email": "demo-client@dealbox.test",
        "registered": true,
        "totals": { "all": 3, "day": 0, "week": 3, "month": 3, "year": 3 },
        "lastBookingAt": "2026-10-05T10:33:07.853Z",
        "byStore": [
          { "storeId": "…", "storeName": "مخبز مسقط النور - الخوض", "count": { "all": 2, "day": 0, "week": 2, "month": 2, "year": 2 } }
        ]
      }
    ],
    "stores": [
      {
        "storeId": "…",
        "storeName": "مخبز مسقط النور - الخوض",
        "totals": { "all": 2, "day": 0, "week": 2, "month": 2, "year": 2 },
        "users": [
          { "clientName": "عميل تجريبي", "phone": "+968 91111111", "count": { "all": 2, "day": 0, "week": 2, "month": 2, "year": 2 } }
        ]
      }
    ]
  }
}
```

### تعاريف الحقول
| الحقل | المصدر | الوصف |
|---|---|---|
| `summary.totalUsers` | `User` (role=client) + `Order.clientName` | عدد المستخدمين الفريدين (مسجلون + زوار حجزوا) |
| `summary.totalBookings` | `Order` | إجمالي الطلبات |
| `summary.activeToday` | `Order.createdAt` | مستخدمون لديهم حجز اليوم (بداية اليوم الحالية) |
| `summary.totalStores` | `Order.storeName/storeId` | عدد المتاجر التي لديها حجوزات |
| `users[].totals` | عدادات `Order.createdAt` | `all` إجمالي + `day` (من بداية اليوم) + `week` (آخر 7 أيام) + `month` (بداية الشهر) + `year` (بداية السنة) |
| `users[].byStore[].count` | نفس العدادات لكل متجر | توزيع حجوزات المستخدم على المتاجر مع عدادات الفترات |
| `users[].registered` | `User` | هل المستخدم حساب مسجّل أم زائر بدون حساب |
| `stores[].totals` | عدادات `Order.createdAt` | حجوزات المتجر الإجمالية وحسب الفترات |
| `stores[].users[].count` | نفس العدادات | حجوزات كل مستخدم داخل هذا المتجر مع عدادات الفترات |

### ملاحظات
- تجميع المستخدم: `clientId` عند وجوده، وإلا تُدمج حجوزات الزائر عبر (الاسم \|\| الهاتف).
- الترتيب: المستخدمون والمتاجر تنازلياً حسب إجمالي الحجوزات.
- لا تُحتسب الفترات مستقلة: أي حجز داخل «اليوم» يدخل تلقائياً في الأسبوع/الشهر/السنة (حسب الحدود الزمنية).
- الواجهة: `src/components/AdminUsersSection.tsx` (قائمة المستخدمين) و`src/components/AdminPickupsSection.tsx` (ملخص حجوزات المتاجر).

## 11. التقرير المحاسبي الشامل (`GET /api/v1/admin/accounting` — أدمن فقط)

مسار يخدم قسم «الحسابات والتقرير المحاسبي»: سجل محاسبي لكل متجر (الحجوزات المؤكدة / الملغية / قيد الاستلام / المكتملة + المبيعات والعمولة والصافي) حسب الفترة، مع المستخدمين الحاجزين لكل متجر وكشف كامل بالحجوزات للبحث والتصفية والتصدير إلى Excel/الأنظمة الخارجية.

### الاستجابة
```json
{
  "success": true,
  "data": {
    "summary": {
      "periods": {
        "all":     { "bookings": 3, "confirmed": 3, "cancelled": 0, "pending": 3, "collected": 0, "gross": 6.3, "commission": 0.945, "net": 5.355 },
        "day":     { "bookings": 0, "confirmed": 0, "cancelled": 0, "pending": 0, "collected": 0, "gross": 0, "commission": 0, "net": 0 },
        "week":    { "bookings": 3, "confirmed": 3, "cancelled": 0, "pending": 3, "collected": 0, "gross": 6.3, "commission": 0.945, "net": 5.355 },
        "month":   { "bookings": 3, "confirmed": 3, "cancelled": 0, "pending": 3, "collected": 0, "gross": 6.3, "commission": 0.945, "net": 5.355 },
        "year":    { "bookings": 3, "confirmed": 3, "cancelled": 0, "pending": 3, "collected": 0, "gross": 6.3, "commission": 0.945, "net": 5.355 }
      },
      "totalStores": 2,
      "totalUsers": 1
    },
    "stores": [
      {
        "storeId": "…",
        "storeName": "مخبز مسقط النور - الخوض",
        "counts":    { "all": 2, "day": 0, "week": 2, "month": 2, "year": 2 },
        "confirmed": { "all": 2, "day": 0, "week": 2, "month": 2, "year": 2 },
        "cancelled": { "all": 0, "day": 0, "week": 0, "month": 0, "year": 0 },
        "pending":   { "all": 2, "day": 0, "week": 2, "month": 2, "year": 2 },
        "collected": { "all": 0, "day": 0, "week": 0, "month": 0, "year": 0 },
        "gross":     { "all": 3.0, "day": 0, "week": 3.0, "month": 3.0, "year": 3.0 },
        "commission":{ "all": 0.45, "day": 0, "week": 0.45, "month": 0.45, "year": 0.45 },
        "net":       { "all": 2.55, "day": 0, "week": 2.55, "month": 2.55, "year": 2.55 },
        "users": [
          { "clientName": "عميل تجريبي", "phone": "+968 91111111", "count": { "all": 2, "day": 0, "week": 2, "month": 2, "year": 2 }, "confirmed": { "…": "…" }, "cancelled": { "…": "…" } }
        ]
      }
    ],
    "bookings": [
      {
        "id": "DB-4396",
        "orderNumber": "…",
        "storeName": "أسواق البركة العُمانية",
        "clientName": "عميل تجريبي",
        "clientPhone": "+968 91111111",
        "quantity": 1,
        "priceOmr": 1.8,
        "commissionOmr": 0.27,
        "netOmr": 1.53,
        "status": "pending",
        "statusText": "بانتظار الحضور",
        "windowTime": "اليوم 18:00 - 22:00",
        "createdAt": "2026-10-05T10:33:07.853Z"
      }
    ]
  }
}
```

### تعاريف الحقول
| الحقل | الوصف |
|---|---|
| `summary.periods[all/day/week/month/year]` | مؤشرات الفترة: `bookings` إجمالي، `confirmed` مؤكدة (غير ملغاة)، `cancelled` ملغية، `pending` قيد الاستلام، `collected` مكتملة، `gross` مبيعات المتاجر، `commission` عمولة المنصة (15%)، `net` صافي التحويل للمتاجر |
| `stores[].counts/confirmed/cancelled` | عدادات المتجر حسب الفترة (إجمالي/مؤكدة/ملغية) |
| `stores[].pending/collected` | عدادات «قيد الاستلام» و«مكتملة الاستلام» حسب الفترة |
| `stores[].gross/commission/net` | المبالغ المالية للمتجر حسب الفترة (تُحسب من الطلبات غير الملغاة فقط) |
| `stores[].users[]` | من حجز من المستخدمين من هذا المتجر مع عدادات الكميات (count) والمؤكدة/الملغية لكل فترة |
| `bookings[]` | كشف كامل بكل الحجوزات (للبحث والتصفية والتصدير) مع المبالغ والعمولة والصافي والحالة |

### حدود الفترات
- `day`: بداية اليوم الحالي (`startOfToday`).
- `week`: آخر 7 أيام (من بداية اليوم − 6 أيام).
- `month`: بداية الشهر الحالي.
- `year`: بداية السنة الحالية.
- `all`: كل الطلبات (بدون حد زمني) — وكل فترة أوسع تشمل ما قبلها (الفترات متداخلة).

### ملاحظات
- «مؤكدة» = كل الطلبات غير الملغاة (`status !== 'cancelled'`).
- المبالغ تُقرَّب لأقرب 3 خانات عشرية بالريال العماني.
- الواجهة: `src/components/AdminAccountingSection.tsx` (سجل المتاجر + دفتر الحجوزات + تصدير CSV بترميز UTF-8 مع BOM يفتح في Excel/Google Sheets + نسخ رابط الواجهة للتكامل الخارجي).

## 12. استعادة كلمة المرور («نسيت كلمة المرور»)

تعمل للأدمن ومسؤول المتجر والمستفيد معاً — الحسابات الثلاثة في جدول `User` نفسه ويُبحث عنها بالبريد.

### `POST /api/v1/auth/forgot-password` (عام)
الطلب: `{ "email": "user@example.com" }`

- تُنشأ `resetPasswordToken` (SHA-256 لرمز عشوائي 32 بايت) + `resetPasswordExpires` (30 دقيقة).
- تُرسل رسالة على البريد (SMTP عبر `nodemailer` إذا ضُبطت متغيرات `MAIL_*` في `backend/.env`).
- **قبل شراء الدومين**: النظام في «وضع التطوير» ويعيد `devResetLink` في الاستجابة ليظهر الرابط مباشرة في الواجهة (لا يوجد مرسل حقيقي بعد).
- الأمان: يُجاب دائماً بنجاح (`mode: 'unknown'`) إذا لم يوجد الحساب حتى لا يُكتشف البريد المسجل.
- الميزة قابلة للإيقاف من إعدادات النظام في لوحة الأدمن (`passwordResetEnabled` في `PlatformSetting` بمفتاح `password-reset`، الافتراضي مفعّل).
- مصادرة التكرار: `forgotPasswordLimiter` (5 في الساعة).

الاستجابة (وضع التطوير):
```json
{
  "success": true,
  "message": "أُرسلت رسالة استعادة كلمة المرور إلى بريدك الإلكتروني",
  "mailMode": "development",
  "devResetLink": "http://localhost:3000/?reset=TOKEN"
}
```

### `POST /api/v1/auth/reset-password` (عام)
الطلب: `{ "token": "TOKEN", "password": "newpassword" }`
- يتحقق من الرمز المجزّأ + الصلاحية (انتهت = رفض).
- يعيد تشفير كلمة المرور بـ bcrypt ويمسح حقلي الاستعادة.
- مصادرة التكرار: `resetPasswordLimiter` (10 في 15 دقيقة).

### إعدادات الأدمن (تبويب «التكامل» في إعدادات النظام وإدارة الصلاحيات)
| المسار | الوصف |
|---|---|
| `GET /api/v1/admin/password-reset-settings` | الحالة: `passwordResetEnabled` + `smtpConfigured` + `mailFrom` + `mailMode` |
| `PATCH /api/v1/admin/password-reset-settings` | الجسم: `{ "passwordResetEnabled": true\|false }` |

### متغيرات البيئة للبريد الفعلي (تُضاف عند شراء الدومين)
```env
MAIL_ENABLED=true
MAIL_HOST=smtp.yourdomain.com
MAIL_PORT=587
MAIL_USER=no-reply@yourdomain.com
MAIL_PASS=******
MAIL_FROM=DealBox عُمان <no-reply@yourdomain.com>
FRONTEND_URL=https://yourdomain.com
```
بدونها يعمل النظام بوضع التطوير: `backend/src/utils/mailer.js` يسجّل الرابط في سجل الخادم وتُعاد `devResetLink` للواجهة.

### الواجهة
- `src/components/PortalAuthView.tsx`: «نسيت كلمة المرور؟» لشاشتي الأدمن ومسؤول المتجر.
- `src/components/ClientAuthView.tsx`: تفعيل الزر «نسيت كلمة المرور؟» في تسجيل دخول المستفيد (وضع البريد).
- `src/components/ResetPasswordView.tsx`: صفحة تعيين كلمة المرور الجديدة (تفتح عبر `?reset=TOKEN`).
- `src/components/AdminSystemSettingsView.tsx`: بطاقة «استعادة كلمة المرور» في تبويب التكامل.

---

## 13. فريق المشرفين والصلاحيات الميدانية (RBAC)

تحديد أدوار المشرفين ومدراء العمليات المصرح لهم بدخول لوحة الآدمن المركزية.

### نمط العمل

- **الدخول للوحة**: يحق الدخول لأي حساب `role: 'admin'` مفعّل. الدور الداخلي `adminRole` يحدد أقسام اللوحة المتاحة (يُخفى ما لا يخص الدور في الواجهة، ويُرفض في الخادم بـ 403).
- **الصلاحيات**: تُشتق من `adminRole` وحدها عبر `backend/src/config/adminRoles.js`. المستخدمون الأقدم بلا `adminRole` يُعاملون كمدير عام (كل الصلاحيات) للحفاظ على التوافق.
- **إدارة الفريق**: مقصورة على `super_admin` (مدير عام). لا يمكن تجميد/تخفيض/حذف آخر مدير عام للنظام، ولا تجميد أو تخفيض الحساب الحالي أثناء الجلسة.

### الأدوار المعتمدة

| الدور | العنوان العربي | الصلاحيات |
|---|---|---|
| `super_admin` | مدير عام للنظام (Super Admin) | الكل: overview، stores، pickups، reports، users، accounting، stories، settings |
| `operations_manager` | مدير العمليات | overview، stores، pickups، reports، users |
| `supervisor` | مشرف ميداني | overview، pickups، reports |
| `logistics_manager` | مشرف النقل الميداني والإغاثة | overview، stores، pickups، reports |
| `financial_officer` | مسؤول التسويات والتدقيق المالي | overview، stores، users، accounting |
| `food_safety` | مراقب جودة وسلامة الأغذية | overview، stores، stories |

### نقاط إدارة الفريق (`GET/POST /api/v1/admin/team*` — صلاحية `settings` + مدير عام)

- `GET /api/v1/admin/team` — قائمة الأعضاء الحقيقيين: `id, name, email, phone, adminRole, roleTitle, badgeColor, permissions[], active, lastLoginAt, isSelf` + كتالوج `roles[]`.
- `POST /api/v1/admin/team` — إنشاء حساب مشرف حقيقي `{name, email, phone, password, adminRole}` (كلمة مرور ≥ 6 أحرف، تفرد البريد).
- `PATCH /api/v1/admin/team/:id` — `{adminRole?, active?, name?, phone?}` مع حراس: لا تجميد/تخفيض النفس، لا إسقاط آخر `super_admin`.
- `DELETE /api/v1/admin/team/:id` — إزالة من الفريق (يُحول `role` إلى `client` ويُمسح `adminRole`؛ لا يُحذف الحساب) مع حراس النفس وآخر مدير عام.

### فرض الصلاحيات في مسارات الأدمن (`requirePermissions`)

| المسار | الصلاحية المطلوبة |
|---|---|
| `/admin/overview`, `/admin/analytics` | overview |
| `/admin/stores` (GET/POST) | stores |
| `/admin/users-analytics` | users |
| `/admin/settlements*`, `/admin/accounting` | accounting |
| `/admin/stories`, `/admin/stories/:id/review` | stories |
| `/admin/support-messages` | reports |
| `/admin/loyalty`, `/admin/announcement`, `/admin/story-settings`, `/admin/password-reset-settings`, `/admin/team*` | settings |

### تهيئة الفريق التجريبي

```bash
npm --prefix backend run db:seed:admin-team   # idempotent — يُنشئ/يُحدّث 7 حسابات بدورها
```

- حسابات تجريبية بكلمة مرور `DemoAdmin123` (سارة الخالد=مدير عام، يوسف المعمري=مدير عمليات، محمد الرواحي=مشرف ميداني، أحمد البلوشي=مشرف نقل، فاطمة الحوسنية=مسؤولة مالية، د. هيثم العامري=مراقب جودة) + `admin@dealbox.test` (مدير عام).
- حساب ديمو لمسؤول المتجر: `store-demo@dealbox.test` / `StoreDemo123` (مرتبط بـ«مخبز مسقط النور - الخوض») — `npm --prefix backend run db:seed:store-demo` (idempotent).

### الواجهة
- `src/adminRoles.ts`: كتالوج العرض (عناوين/ألوان/وصف الأدوار) — الخادم هو المرجع للصلاحيات.
- `src/components/AdminSystemSettingsView.tsx`: تبويب «فريق الإدارة والصلاحيات (RBAC)» — كتالوج الأدوار + جدول الأعضاء الحقيقيين + إضافة/تغيير دور/تجميد/إزالة (لفئة مدير العام فقط).
- `src/components/AdminDashboardView.tsx`: إخفاء أقسام اللوحة حسب `permissions[]` من الجلسة.
- `src/components/PortalAuthView.tsx` / `src/App.tsx`: تمرير `adminRole` و`permissions` مع جلسة الدخول.
- `src/components/AdminPaidStoriesSection.tsx`: عرض القصص بصلاحية «القصص» وحدها، ونموذج الرسوم بصلاحية «الإعدادات».

## 14. المحتوى التسويقي للموقع (MarketingContent + API)

وثيقة واحدة (key: 'marketing') تتحكم بكامل صفحة الهبوط — نصوص، أقسام، أرقام الأثر، صور مرفوعة، وإعدادات SEO. تُدار من لوحة الآدمن (تبويب «الموقع التسويقي» داخل إعدادات النظام) وتُعرض للزوار عبر واجهة عامة.

### التخزين (MarketingContent)

الأقسام الرئيسية (كلها نصوص/قوائم قابلة للتحرير من المحرر):
| القسم | المحتوى |
|---|---|
| seo | 	itle, description, keywords, ogImage — تُطبَّق على document.title ووسوم meta في App.tsx |
| hero | شارة، شعار رئيسي، نص فرعي، سطر تمييز، زرّا CTA، شرائح موثوقة، imageUrl |
| offers[] | صناديق العروض: emoji, store, title, newPrice, oldPrice, save, tag |
| alueBand[] | شريط القيمة: icon, title, desc (حتى 4) |
| eatures | sectionTitle, sectionSub, items[]{icon, title, desc} |
| steps | sectionTitle, items[]{icon, title, desc} |
| growthHacks[] | icon, title, headline, desc (التوصية + الفلاش سيلز) |
| impact | sectionTitle, sectionSub, stats[]{icon, value, decimals, label} — عدّادات متحركة |
| campaigns | sectionBadge, sectionTitle, sectionSub, items[]{icon, channel, name, desc, audience} |
| partners | قسم المتاجر: شارة، عنوان، نقاط بيع، CTA، معادلة، دليل شريك |
| download | عنوان، نص، ملاحظة، رابطا المتجرين |
| ooter | نبذة + حقوق النشر |
| images | logoUrl, heroImageUrl, downloadImageUrl — مسارات /uploads/marketing/* |

### المسارات

| المسار | الصلاحية | الوصف |
|---|---|---|
| GET /api/v1/marketing | عام | محتوى الموقع للعرض (عند الغياب يُعاد الافتراضي) |
| GET /api/v1/admin/marketing | settings | المحتوى الكامل للمحرر |
| PUT /api/v1/admin/marketing | settings | حفظ المحتوى (تنظيف عميق + سقوف أمان) |
| POST /api/v1/admin/marketing/images | settings | رفع صورة (multer، 5MB، PNG/JPG/GIF/WebP/SVG) بـ slot: logo/hero/download |

### البذر والواجهة

- 
pm --prefix backend run db:seed:marketing — بذر افتراضي idempotent (لا يمس تعديلات الآدمن).
- MarketingSiteView.tsx يجلب المحتوى عند الفتح مع دمجه على نسخة احتياطية محلية (src/marketingDefaults.ts) عند تعذر الاتصال.
- الرفع يُخزن في ackend/uploads/marketing ويُقدَّم ثابتاً من /uploads مع بروكسي Vite.

## 15. بيانات لوحة المتجر الحقيقية (/api/v1/store/* — مسؤول المتجر)

لوحة مسؤول المتجر تجيب بيانات متجره الخاصة من قاعدة البيانات — **متجر جديد يظهر فارغاً تماماً** (بدون سلال/طلبات/إحصائيات افتراضية).

| المسار | الوصف |
|---|---|
| GET /api/v1/store/boxes | سلال المتجر فقط (Box.find({ storeId })) — متجر جديد = مصفوفة فارغة |
| GET /api/v1/store/stats | إحصائيات حقيقية: ctiveBoxesCount, 	otalOrders, 	odayPendingPickups, 	odayCollectedCount, weeklyGrossRevenueOmr, 
etPayoutPendingOmr (بعد خصم 15%) |
| GET /api/v1/store/orders | طلبات المتجر (Order.find({ storeId })) مع ookingCode, clientName, boxTitle, pricePaidOmr, status, pickupWindow |
| POST /api/v1/store/boxes | إضافة سلة جديدة للمتجر |
| POST /api/v1/store/verify-code | تأكيد استلام كود الحجز (يحدّث الطلب إلى collected) |

### ملاحظات
- كل المسارات تحتاج Authorization: Bearer <token> لدور store_manager.
- لا توجد بيانات تجريبية في لوحة المتجر — الأرقام كلها محسوبة من Box وOrder المرتبطين بـ storeId.
- عند تعذر الجلب تبقى الواجهة فارغة (حالات «لا توجد سلال» / «لا توجد طلبات»).

### إعدادات القصص لكل متجر (PATCH /api/v1/admin/stores/:id/story-settings — صلاحية stores)

كل متجر له رسوم قصة خاصة وفترة فوترة:
- **الجسم:** { storyFeeOmr, storyFeePeriod } حيث الفترة daily | weekly | monthly.
- **التحقق:** الرسوم 0–1000 ر.ع، الفترة إحدى القيم الثلاث.
- **الأثر:** إنشاء القصة يستخدم إعداد المتجر أولاً (ثم العالمية)، ويُخزَّن eeOmr وeePeriod في StoreStory.
- **لوحة المتجر:** GET /api/v1/store/story-settings لمسؤول المتجر يعيد إعدادات متجره (storyPromotionFeeOmr, storyFeePeriod, storyEnabled).
