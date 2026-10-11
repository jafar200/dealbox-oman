import React, { useEffect, useMemo, useState } from 'react';
import { AdminAccountingData, AdminAccountingStore, AdminPeriodKey } from '../types';

const PERIODS: { key: AdminPeriodKey; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'day', label: 'اليوم' },
  { key: 'week', label: 'الأسبوع' },
  { key: 'month', label: 'الشهر' },
  { key: 'year', label: 'السنة' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'pending', label: 'قيد الاستلام' },
  { value: 'collected', label: 'مكتمل الاستلام' },
  { value: 'cancelled', label: 'ملغاة' },
];

interface AdminAccountingSectionProps {
  authToken: string;
  onNotify?: (msg: string) => void;
}

const fmtOmr = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtDate = (v: string) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('ar-OM', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

// CSV بترميز UTF-8 مع BOM حتى تُفتح الأرقام العربية والرموز بشكل صحيح في Excel/Google Sheets
function toCsv(rows: (string | number)[][]): string {
  return (
    '\uFEFF' +
    rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  );
}

function useDownload(): (filename: string, rows: (string | number)[][], notify?: (m: string) => void) => void {
  return (filename, rows, notify) => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (notify) notify(`تم تصدير الملف «${filename}» — يفتح مباشرة في Excel أو Google Sheets`);
  };
}

export function AdminAccountingSection({ authToken, onNotify }: AdminAccountingSectionProps) {
  const [data, setData] = useState<AdminAccountingData | null>(null);
  const [period, setPeriod] = useState<AdminPeriodKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [apiCopied, setApiCopied] = useState(false);
  const download = useDownload();

  useEffect(() => {
    if (!authToken) return;
    let isActive = true;
    fetch('/api/v1/admin/accounting', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر تحميل التقرير المحاسبي');
        if (isActive && result?.data) setData(result.data);
      })
      .catch((error) => {
        if (isActive && onNotify) onNotify(error instanceof Error ? error.message : 'تعذر تحميل التقرير المحاسبي');
      });
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || 'الكل';
  const pt = data ? data.summary.periods[period] : null;

  const storeOptions = useMemo(() => {
    if (!data) return [];
    const names = new Set<string>(data.stores.map((s) => s.storeName));
    data.bookings.forEach((b) => names.add(b.storeName));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [data]);

  const filteredBookings = useMemo(() => {
    if (!data) return [];
    const term = searchTerm.trim().toLowerCase();
    return data.bookings.filter((b) => {
      if (storeFilter !== 'all' && b.storeName !== storeFilter) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!term) return true;
      return (
        b.id.toLowerCase().includes(term) ||
        b.orderNumber.toLowerCase().includes(term) ||
        b.storeName.toLowerCase().includes(term) ||
        b.clientName.toLowerCase().includes(term) ||
        b.clientPhone.toLowerCase().includes(term) ||
        b.statusText.toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, statusFilter, storeFilter]);

  if (!data) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-stone-200/80 shadow-xs text-center text-xs text-stone-400">
        جارِ تجهيز التقرير المحاسبي الشامل من قاعدة البيانات...
      </div>
    );
  }

  const kpis = [
    { label: `إجمالي الحجوزات (${periodLabel})`, value: pt ? String(pt.bookings) : '0', tone: 'text-[#131b2e]', icon: 'fact_check', sub: `${data.summary.totalStores} متجر` },
    { label: `حجوزات مؤكدة (${periodLabel})`, value: pt ? String(pt.confirmed) : '0', tone: 'text-[#006948]', icon: 'verified', sub: 'غير الملغاة' },
    { label: `حجوزات ملغية (${periodLabel})`, value: pt ? String(pt.cancelled) : '0', tone: 'text-rose-600', icon: 'cancel', sub: 'أعيد طرح السلة' },
    { label: `قيد الاستلام (${periodLabel})`, value: pt ? String(pt.pending) : '0', tone: 'text-[#855300]', icon: 'hourglass_top', sub: 'بانتظار الحضور' },
    { label: `مكتملة الاستلام (${periodLabel})`, value: pt ? String(pt.collected) : '0', tone: 'text-stone-600', icon: 'inventory_2', sub: 'تم التسليم' },
    { label: `مبيعات المتاجر (${periodLabel})`, value: pt ? fmtOmr(pt.gross) : '0', tone: 'text-[#006948]', icon: 'payments', sub: 'ر.ع' },
    { label: `عمولة المنصة (${periodLabel})`, value: pt ? fmtOmr(pt.commission) : '0', tone: 'text-[#131b2e]', icon: 'percent', sub: '15%' },
    { label: `صافي تحويل المتاجر (${periodLabel})`, value: pt ? fmtOmr(pt.net) : '0', tone: 'text-stone-700', icon: 'account_balance_wallet', sub: 'ر.ع' },
  ];

  const apiUrl = `${window.location.origin}/api/v1/admin/accounting`;

  const exportStores = () => {
    const rows: (string | number)[][] = [
      ['المتجر', `الحجوزات (${periodLabel})`, `المؤكدة (${periodLabel})`, `الملغية (${periodLabel})`, `قيد الاستلام (${periodLabel})`, `مكتملة (${periodLabel})`, `المبيعات ر.ع (${periodLabel})`, `العمولة ر.ع (${periodLabel})`, `الصافي ر.ع (${periodLabel})`, 'عدد المستخدمين الحاجزين'],
      ...data.stores.map((s: AdminAccountingStore) => [
        s.storeName,
        s.counts[period],
        s.confirmed[period],
        s.cancelled[period],
        s.pending[period],
        s.collected[period],
        fmtOmr(s.gross[period]),
        fmtOmr(s.commission[period]),
        fmtOmr(s.net[period]),
        s.users.length,
      ]),
    ];
    download(`dealbox-accounting-stores-${period}.csv`, rows, onNotify);
  };

  const exportBookings = () => {
    const rows: (string | number)[][] = [
      ['رقم التصريح', 'رقم الطلب', 'المتجر', 'المستفيد', 'الهاتف', 'الكمية', 'المبلغ ر.ع', 'العمولة ر.ع', 'الصافي ر.ع', 'الحالة', 'نافذة الاستلام', 'التاريخ'],
      ...filteredBookings.map((b) => [
        b.id, b.orderNumber, b.storeName, b.clientName, b.clientPhone, b.quantity,
        fmtOmr(b.priceOmr), fmtOmr(b.commissionOmr), fmtOmr(b.netOmr), b.statusText, b.windowTime, fmtDate(b.createdAt),
      ]),
    ];
    download('dealbox-accounting-bookings.csv', rows, onNotify);
  };

  const copyApiLink = async () => {
    try {
      await navigator.clipboard.writeText(apiUrl);
      setApiCopied(true);
      if (onNotify) onNotify('تم نسخ رابط الواجهة البرمجية — يمكنك ربطه بأي نظام خارجي (Excel Power Query، Google Sheets، ERP)');
      window.setTimeout(() => setApiCopied(false), 3000);
    } catch {
      if (onNotify) onNotify('تعذر النسخ التلقائي — انسخ الرابط يدوياً من الحقل');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + period selector + exports */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-[#131b2e]">الحسابات والتقرير المحاسبي الشامل</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-xs font-bold">بيانات حقيقية</span>
          </div>
          <p className="text-xs text-stone-500">
            حجوزات كل متجر (المؤكدة / الملغية / قيد الاستلام / المكتملة) + المبالغ المالية • بحث وفلترة عن أي حجز • تصدير Excel وربط خارجي
          </p>
        </div>
        <div className="flex flex-col items-stretch md:flex-row md:items-center gap-2.5">
          <div className="flex items-center rounded-xl bg-[#f2f3ff] p-1 text-xs font-semibold text-stone-600 overflow-x-auto">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  period === p.key ? 'bg-white text-[#006948] font-bold shadow-xs' : 'hover:text-[#131b2e]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportStores}
            className="h-10 px-3 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">grid_on</span>
            تصدير المتاجر (Excel)
          </button>
          <button
            type="button"
            onClick={exportBookings}
            className="h-10 px-3 rounded-xl bg-[#e2e7ff] hover:bg-[#dae2fd] text-[#131b2e] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">table_view</span>
            تصدير الحجوزات (Excel)
          </button>
        </div>
      </div>

      {/* External integration card */}
      <div className="p-5 rounded-2xl bg-[#e9f7f0] border border-emerald-200/70 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006948] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">api</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-black text-[#131b2e]">التكامل الخارجي وإدارة النظام من أي موقع</span>
              <p className="text-xs text-stone-600 leading-relaxed">
                ملفات Excel (CSV) المُصدَّرة تُفتح مباشرة في Excel أو Google Sheets لإدارة الحسابات، ويمكن ربط هذه الواجهة البرمجية
                بأي نظام خارجي (ERP، Power Query، Zapier، لوحة Salla/Shopify) عبر الطلب التالي مع توكن أدمن:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-emerald-200 max-w-full">
              <code className="text-[11px] font-mono text-stone-700 truncate" dir="ltr">GET {apiUrl}</code>
            </div>
            <button
              type="button"
              onClick={copyApiLink}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                apiCopied ? 'bg-[#006948] text-white' : 'bg-[#e2e7ff] hover:bg-[#dae2fd] text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{apiCopied ? 'check' : 'link'}</span>
              {apiCopied ? 'تم النسخ' : 'نسخ الرابط'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-semibold">{k.label}</span>
              <div className="w-8 h-8 rounded-lg bg-[#e2e7ff] text-stone-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[17px]">{k.icon}</span>
              </div>
            </div>
            <span className={`text-2xl font-black font-mono ${k.tone}`} dir="ltr">{k.value}</span>
            <span className="text-[10px] text-stone-400 font-medium">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Stores accounting table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base sm:text-lg font-black text-[#131b2e]">سجل المتاجر المحاسبي — فترة «{periodLabel}»</h2>
            <p className="text-xs text-stone-500">
              لكل متجر: الحجوزات المؤكدة / الملغية / قيد الاستلام + المبيعات والعمولة والصافي، ويمكن توسيع صف المتجر لعرض المستخدمين الحاجزين
            </p>
          </div>
          <span className="text-[11px] font-bold text-stone-400 shrink-0">{data.stores.length} متجر</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff] text-stone-600 text-xs font-bold">
                <th className="py-3 px-4 rounded-r-xl">المتجر</th>
                <th className="py-3 px-4 text-center">الحجوزات</th>
                <th className="py-3 px-4 text-center">المؤكدة</th>
                <th className="py-3 px-4 text-center">الملغية</th>
                <th className="py-3 px-4 text-center">قيد الاستلام</th>
                <th className="py-3 px-4 text-center">المبيعات (ر.ع)</th>
                <th className="py-3 px-4 text-center">العمولة (ر.ع)</th>
                <th className="py-3 px-4 text-center">الصافي (ر.ع)</th>
                <th className="py-3 px-4 text-center">المستخدمون</th>
                <th className="py-3 px-4 rounded-l-xl text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y-0 text-[#131b2e]">
              {data.stores.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-stone-400">
                    لا توجد حجوزات مسجلة بعد.
                  </td>
                </tr>
              ) : (
                data.stores.map((store, idx) => {
                  const pendingInPeriod = store.pending[period];
                  const expanded = expandedStore === (store.storeId || store.storeName);
                  return (
                    <React.Fragment key={store.storeId || store.storeName}>
                      <tr className={`hover:bg-[#f2f3ff]/60 transition-colors ${idx % 2 === 1 ? 'bg-[#f2f3ff]/30' : ''} ${expanded ? 'bg-[#e9f7f0]' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#e2e7ff] text-stone-600 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[17px]">storefront</span>
                            </div>
                            <span className="font-black truncate">{store.storeName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-[#e2e7ff] text-[#131b2e] font-black font-mono" dir="ltr">{store.counts[period]}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] font-bold" dir="ltr">{store.confirmed[period]}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold" dir="ltr">{store.cancelled[period]}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffddb8] text-[#855300] font-bold" dir="ltr">{pendingInPeriod}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-stone-700" dir="ltr">{fmtOmr(store.gross[period])}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-stone-600" dir="ltr">{fmtOmr(store.commission[period])}</td>
                        <td className="py-3 px-4 text-center font-mono font-black text-[#006948]" dir="ltr">{fmtOmr(store.net[period])}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-[#131b2e]" dir="ltr">{store.users.length}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedStore(expanded ? null : (store.storeId || store.storeName))}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-colors ${
                              expanded ? 'bg-[#006948] text-white' : 'bg-[#f2f3ff] text-stone-600 hover:bg-[#eaedff]'
                            }`}
                            title={expanded ? 'إغلاق التفاصيل' : 'عرض المستخدمين الحاجزين'}
                          >
                            <span className="material-symbols-outlined text-[18px]">{expanded ? 'expand_less' : 'expand_more'}</span>
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-[#f7faf8]">
                          <td colSpan={10} className="py-4 px-5">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-xs font-black text-[#131b2e] mb-1">
                                المستخدمون الحاجزون من «{store.storeName}» {periodLabel !== 'الكل' ? `— فترة «${periodLabel}»` : ''}
                              </span>
                              {store.users.length === 0 ? (
                                <span className="text-xs text-stone-400">لا مستخدمين حجزوا من هذا المتجر.</span>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                  {store.users.map((u) => (
                                    <div key={`${u.clientName}||${u.phone}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-stone-200/70">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="material-symbols-outlined text-[16px] text-stone-400 shrink-0">person</span>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-bold text-xs truncate">{u.clientName}</span>
                                          {u.phone && <span className="text-[10px] text-stone-400" dir="ltr">{u.phone}</span>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[10px] font-bold text-stone-500" dir="ltr">{u.count[period]} حجز</span>
                                        <span className="text-[10px] font-bold text-[#006948]" dir="ltr">{u.confirmed[period]} مؤكد</span>
                                        <span className="text-[10px] font-bold text-rose-500" dir="ltr">{u.cancelled[period]} ملغي</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings ledger with search + filters */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base sm:text-lg font-black text-[#131b2e]">دفتر الحجوزات — بحث وفلترة عن أي حجز</h2>
              <p className="text-xs text-stone-500">
                كشف مفصل بكل الحجوزات مع المبالغ والعمولة والصافي ({data.bookings.length} حجز مسجل)
              </p>
            </div>
            <span className="text-[11px] font-bold text-stone-400 shrink-0">المعروضة: {filteredBookings.length}</span>
          </div>
          <div className="flex flex-col md:flex-row items-stretch gap-2.5">
            <div className="relative flex-1 min-w-0">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px] pointer-events-none">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في رقم التصريح، رقم الطلب، المتجر، المستفيد، الهاتف..."
                className="w-full h-10 pr-9 pl-3 rounded-xl bg-[#f2f3ff] border border-stone-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 text-xs font-semibold text-[#131b2e] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 text-xs font-semibold text-[#131b2e] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20 max-w-[200px]">
                <option value="all">كل المتاجر</option>
                {storeOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setStoreFilter('all'); }}
                className="h-10 px-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-stone-600 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                مسح
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff] text-stone-600 text-xs font-bold">
                <th className="py-3 px-4 rounded-r-xl">رقم التصريح</th>
                <th className="py-3 px-4">المتجر</th>
                <th className="py-3 px-4">المستفيد / المندوب</th>
                <th className="py-3 px-4">الهاتف</th>
                <th className="py-3 px-4 text-center">الكمية</th>
                <th className="py-3 px-4 text-center">المبلغ (ر.ع)</th>
                <th className="py-3 px-4 text-center">العمولة (ر.ع)</th>
                <th className="py-3 px-4 text-center">الصافي (ر.ع)</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 rounded-l-xl">التاريخ</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y-0 text-[#131b2e]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-stone-400">
                    لا توجد حجوزات مطابقة لمعايير البحث والتصفية.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => (
                  <tr key={b.id} className={`hover:bg-[#f2f3ff]/60 transition-colors ${idx % 2 === 1 ? 'bg-[#f2f3ff]/30' : ''}`}>
                    <td className="py-3 px-4 font-mono font-bold text-[#006948]" dir="ltr">{b.id}</td>
                    <td className="py-3 px-4 font-semibold">{b.storeName}</td>
                    <td className="py-3 px-4 font-bold">{b.clientName}</td>
                    <td className="py-3 px-4 text-stone-500 font-mono" dir="ltr">{b.clientPhone}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold" dir="ltr">{b.quantity}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold" dir="ltr">{fmtOmr(b.priceOmr)}</td>
                    <td className="py-3 px-4 text-center font-mono text-stone-600" dir="ltr">{fmtOmr(b.commissionOmr)}</td>
                    <td className="py-3 px-4 text-center font-mono font-black text-[#006948]" dir="ltr">{fmtOmr(b.netOmr)}</td>
                    <td className="py-3 px-4">
                      {b.status === 'collected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#006948]/10 text-[#006948] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006948]"></span>
                          {b.statusText}
                        </span>
                      )}
                      {b.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffddb8] text-[#855300] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#855300] animate-ping"></span>
                          {b.statusText}
                        </span>
                      )}
                      {b.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          {b.statusText}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-medium whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}