import React, { useState } from 'react';

export const ArchitectureDocsView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<'tree' | 'models' | 'api' | 'docker'>('tree');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);

  const testEndpoint = (endpoint: string) => {
    setLoadingApi(true);
    setApiResponse(null);

    // الطلب الفعلي إلى خادم Express (يقرأ من MongoDB)
    if (endpoint === '/api/v1/client/boxes') {
      fetch(endpoint)
        .then(async (response) => {
          const payload = await response.json().catch(() => null);
          setApiResponse(
            JSON.stringify(
              payload ?? { success: false, message: `تعذر قراءة الاستجابة (HTTP ${response.status})` },
              null,
              2
            )
          );
        })
        .catch((error: unknown) => {
          setApiResponse(
            JSON.stringify(
              {
                success: false,
                message: error instanceof Error ? error.message : 'تعذر الوصول إلى الخادم',
              },
              null,
              2
            )
          );
        })
        .finally(() => setLoadingApi(false));
      return;
    }

    setTimeout(() => {
      setLoadingApi(false);
      if (endpoint === '/api/v1/store/verify-code') {
        setApiResponse(
          JSON.stringify(
            {
              success: true,
              message: 'تم التحقق بنجاح من كود الحجز (DB-4821)! سلّم الصندوق للزبون.',
              data: {
                bookingCode: 'DB-4821',
                client: 'أحمد البلوشي (+968 9123 4567)',
                store: 'مخبز مسقط النور - الخوض',
                status: 'collected',
                collectedAt: new Date().toISOString(),
              },
            },
            null,
            2
          )
        );
      } else if (endpoint === '/api/v1/admin/overview') {
        setApiResponse(
          JSON.stringify(
            {
              success: true,
              platform: 'DealBox Sultanate of Oman',
              data: {
                totalPartnerStores: 28,
                alKhoudhStores: 12,
                totalOrdersMonth: 1420,
                grossMerchandiseValueOmr: 1240.5,
                platformTakeRate: '15%',
                netCommissionOmr: 186.075,
                foodSavedKg: 890.4,
              },
            },
            null,
            2
          )
        );
      }
    }, 400);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="bg-[#131b2e] text-white p-5 rounded-3xl border border-[#2c3b59] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-emerald-400">
              schema
            </span>
            <h1 className="text-xl font-black text-white">معمارية النظام ومخططات Mongoose</h1>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            توثيق الهيكل البرمجي المعتمد لـ DealBox (تطبيقات الواجهة الثلاثة + خادم Node.js / Express + قاعدة MongoDB)
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="flex items-center gap-1.5 bg-[#1b253b] p-1 rounded-xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedDoc('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDoc === 'tree' ? 'bg-[#006948] text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            هيكل الملفات (Tree)
          </button>
          <button
            type="button"
            onClick={() => setSelectedDoc('models')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDoc === 'models' ? 'bg-[#006948] text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            مخططات Mongoose
          </button>
          <button
            type="button"
            onClick={() => setSelectedDoc('api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDoc === 'api' ? 'bg-[#006948] text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            فحص نقاط الـ API
          </button>
          <button
            type="button"
            onClick={() => setSelectedDoc('docker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDoc === 'docker' ? 'bg-[#006948] text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Docker & تشغيل السيرفر
          </button>
        </div>
      </div>

      {/* Doc 1: Tree */}
      {selectedDoc === 'tree' && (
        <div className="bg-stone-900 text-stone-200 p-6 rounded-2xl border border-stone-800 font-mono text-xs leading-relaxed overflow-x-auto text-left" dir="ltr">
          <div className="text-emerald-400 font-bold mb-3 font-sans text-sm text-right" dir="rtl">
            📂 هيكل مجلدات المشروع المكتمل في المستودع:
          </div>
          <pre>{`dealbox/
├── apps/                         # تطبيقات الواجهة الأمامية (Front-end Apps)
│   ├── client-app/               # [1] تطبيق/موقع الزبون (Customer PWA)
│   ├── store-dashboard/          # [2] لوحة تحكم مسؤول المتجر (Store Dashboard)
│   └── admin-dashboard/          # [3] لوحة تحكم الآدمن (Admin Dashboard)
│
├── backend/                      # [4] خادم Node.js / Express + Mongoose
│   ├── src/
│   │   ├── config/               # إعدادات الاتصال بقاعدة البيانات والبيئة
│   │   │   ├── db.js             # الاتصال بـ MongoDB عبر mongoose.connect()
│   │   │   └── env.js            # متغيرات البيئة (.env)
│   │   │
│   │   ├── models/               # مخططات المونجوس (Mongoose Schemas & Models)
│   │   │   ├── User.js           # المستخدمين (Role: client | store_manager | admin)
│   │   │   ├── Store.js          # بيانات المقاهي والمخابز في الخوض
│   │   │   ├── Box.js            # سلال المفاجآت (الكمية، وقت الاستلام، السعر بالريال العماني)
│   │   │   ├── Order.js          # الطلبات ورقم كود الاستلام (Booking Code DB-XXXX)
│   │   │   └── Settlement.js     # التسويات والعمولات الأسبوعية للمحلات (15% DealBox take rate)
│   │   │
│   │   ├── controllers/          # المتحكمات والمنطق البرمجي (Controllers)
│   │   │   ├── clientController.js
│   │   │   ├── storeController.js
│   │   │   ├── adminController.js
│   │   │   └── authController.js
│   │   │
│   │   ├── routes/               # تقسيم المسارات وحمايتها (RBAC Routes)
│   │   │   ├── clientRoutes.js   # /api/v1/client
│   │   │   ├── storeRoutes.js    # /api/v1/store
│   │   │   ├── adminRoutes.js    # /api/v1/admin
│   │   │   └── authRoutes.js     # /api/v1/auth
│   │   │
│   │   ├── middlewares/          # التحقق والأمان
│   │   │   ├── authMiddleware.js # التحقق من JWT والـ Role
│   │   │   └── errorMiddleware.js# معالجة الأخطاء الموحدة
│   │   │
│   │   ├── utils/                # أدوات مساعدة (توليد كود الحجز DB-XXXX، التواريخ)
│   │   └── server.js             # نقطة انطلاق سيرفر Express
│   │
│   ├── .env                      # يحتوي على MONGO_URI
│   ├── package.json              # المكتبات (express, mongoose, dotenv, jsonwebtoken, bcryptjs)
│   └── Dockerfile
│
├── docs/                         # وثائق الـ Vibe Coding وتوجيهات الـ AI
│   ├── DB_SCHEMA.md             # وصف Mongoose Schemas بالتفصيل
│   └── PROMPTS/
│
├── docker-compose.yml            # تشغيل MongoDB + Backend محلياً
└── README.md`}</pre>
        </div>
      )}

      {/* Doc 2: Models */}
      {selectedDoc === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-[#006948] font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>1. User Schema (`User.js`)</span>
            </div>
            <p className="text-xs text-stone-600">
              إدارة مستخدمي النظام العماني وتحديد الصلاحيات عبر <code>role: ['client', 'store_manager', 'admin']</code>.
            </p>
            <div className="bg-stone-50 p-3 rounded-xl font-mono text-[11px] text-stone-700 overflow-x-auto text-left" dir="ltr">
              name, email, phone (+968), password, role, storeId, wilayah ('السيب/الخوض'), ecoScoreKgSaved
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-[#006948] font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>2. Store Schema (`Store.js`)</span>
            </div>
            <p className="text-xs text-stone-600">
              المخابز والمطاعم والمقاهي في الخوض مع رقم السجل التجاري وحساب بنك مسقط للتحويلات.
            </p>
            <div className="bg-stone-50 p-3 rounded-xl font-mono text-[11px] text-stone-700 overflow-x-auto text-left" dir="ltr">
              name, crNumber (CR-XXXX), category, wilayah, area, coordinates, commissionRate (0.15), bankDetails (IBAN)
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-[#006948] font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              <span>3. Box Schema (`Box.js`)</span>
            </div>
            <p className="text-xs text-stone-600">
              صناديق المفاجآت اليومية بأسعار مخفضة بالريال العماني ونافذة استلام محددة.
            </p>
            <div className="bg-stone-50 p-3 rounded-xl font-mono text-[11px] text-stone-700 overflow-x-auto text-left" dir="ltr">
              storeId, title, category, originalPrice (ر.ع), discountedPrice (ر.ع), remainingCount, pickupStart, pickupEnd
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-[#006948] font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>4. Order Schema (`Order.js`)</span>
            </div>
            <p className="text-xs text-stone-600">
              حجز الزبون وكود الاستلام السري الفريد <code>bookingCode (DB-XXXX)</code> وحالة الطلب.
            </p>
            <div className="bg-stone-50 p-3 rounded-xl font-mono text-[11px] text-stone-700 overflow-x-auto text-left" dir="ltr">
              orderNumber, bookingCode, clientId, storeId, pricePaidOmr, platformCommissionOmr (15%), status: 'pending'|'collected'
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-[#006948] font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
              <span>5. Settlement Schema (`Settlement.js`)</span>
            </div>
            <p className="text-xs text-stone-600">
              التسويات المالية الأسبوعية: خصم عمولة المنصة 15% وتحويل الصافي لحساب المتجر العماني.
            </p>
            <div className="bg-stone-50 p-3 rounded-xl font-mono text-[11px] text-stone-700 overflow-x-auto text-left" dir="ltr">
              settlementNumber, storeId, period, totalOrdersCount, grossSalesOmr, platformCommissionOmr, netPayoutOmr, status: 'transferred', bankDetails
            </div>
          </div>
        </div>
      )}

      {/* Doc 3: Interactive API tester */}
      {selectedDoc === 'api' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-5">
          <div>
            <h3 className="text-sm font-black text-[#131b2e]">تجربة نقاط الاتصال البرمجية (REST API Playground)</h3>
            <p className="text-xs text-stone-500">
              انقر لتجربة طلبات الـ API الفعلية واستعراض الـ Payload والاستجابة الفورية:
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => testEndpoint('/api/v1/client/boxes')}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">GET</span>
              <span>/api/v1/client/boxes</span>
            </button>

            <button
              type="button"
              onClick={() => testEndpoint('/api/v1/store/verify-code')}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">POST</span>
              <span>/api/v1/store/verify-code (DB-4821)</span>
            </button>

            <button
              type="button"
              onClick={() => testEndpoint('/api/v1/admin/overview')}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">GET</span>
              <span>/api/v1/admin/overview</span>
            </button>
          </div>

          {loadingApi && (
            <div className="text-center py-4 text-xs font-bold text-stone-500">
              جارِ إرسال الطلب إلى خادم Express...
            </div>
          )}

          {apiResponse && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-stone-500">استجابة الخادم (HTTP 200 OK):</div>
              <pre
                className="bg-stone-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto text-left"
                dir="ltr"
              >
                {apiResponse}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Doc 4: Docker & Run */}
      {selectedDoc === 'docker' && (
        <div className="bg-stone-900 text-stone-200 p-6 rounded-2xl border border-stone-800 space-y-4 text-left font-mono text-xs" dir="ltr">
          <div className="text-emerald-400 font-bold text-sm text-right" dir="rtl">
            🐳 إعداد وتشغيل Docker Compose محلياً:
          </div>
          <pre className="bg-black/50 p-4 rounded-xl text-stone-300">{`# 1. تشغيل قاعدة بيانات MongoDB مع سيرفر DealBox:
docker-compose up -d

# 2. فحص الحاويات النشطة:
docker ps

# 3. استعراض سجلات الخادم المباشرة:
docker-compose logs -f backend

# 4. نقطة فحص الصحة:
curl http://localhost:5000/api/health`}</pre>
        </div>
      )}
    </div>
  );
};
