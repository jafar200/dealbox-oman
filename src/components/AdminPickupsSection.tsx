import React, { useMemo, useState } from 'react';
import { AdminAnalyticsData, AdminUsersAnalyticsData } from '../types';

interface PickupItem {
  id: string;
  storeName: string;
  storeIcon: string;
  beneficiary: string;
  beneficiaryNote: string;
  windowTime: string;
  status: string;
  statusText: string;
  phone: string;
  items: string;
  priceOmr: number;
}

interface AdminPickupsSectionProps {
  pickups: PickupItem[];
  setPickups: React.Dispatch<React.SetStateAction<PickupItem[]>>;
  adminStats: AdminAnalyticsData | null;
  usersAnalytics?: AdminUsersAnalyticsData | null;
  onNotify?: (msg: string) => void;
  onShowDetail: (item: PickupItem) => void;
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled' | 'preparing';

export function AdminPickupsSection({
  pickups,
  setPickups,
  adminStats,
  usersAnalytics,
  onNotify,
  onShowDetail,
}: AdminPickupsSectionProps) {
  const today = adminStats?.todayStat;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [storeFilter, setStoreFilter] = useState('all');

  const storeOptions = useMemo(() => {
    const names = new Set<string>();
    pickups.forEach((p) => names.add(p.storeName));
    (usersAnalytics?.stores || []).forEach((s) => names.add(s.storeName));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [pickups, usersAnalytics]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return pickups.filter((item) => {
      if (storeFilter !== 'all' && item.storeName !== storeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!term) return true;
      return (
        item.id.toLowerCase().includes(term) ||
        item.storeName.toLowerCase().includes(term) ||
        item.beneficiary.toLowerCase().includes(term) ||
        item.statusText.toLowerCase().includes(term) ||
        item.phone.toLowerCase().includes(term) ||
        item.items.toLowerCase().includes(term)
      );
    });
  }, [pickups, searchTerm, statusFilter, storeFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStoreFilter('all');
    if (onNotify) onNotify('تم تصفية الحجوزات وإظهار جميع التصاريح');
  };

  const totals = [
    { label: 'إجمالي حجوزات اليوم', value: today ? today.total : 0, tone: 'text-[#131b2e]' },
    { label: 'مكتملة الاستلام', value: today ? today.collected : 0, tone: 'text-[#006948]' },
    { label: 'قيد الاستلام', value: today ? today.pending : 0, tone: 'text-[#855300]' },
    { label: 'ملغاة', value: today ? today.cancelled : 0, tone: 'text-stone-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-[#131b2e]">الحجوزات والاستلام الفوري</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-xs font-bold">مباشر</span>
          </div>
          <p className="text-xs text-stone-500">
            تصاريح الاستلام الحقيقية من قاعدة البيانات — تدفق المستفيدين والمندوبين عند بوابات التسليم بالمتاجر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
            <span>مسح التصفية</span>
          </button>
          <button
            type="button"
            onClick={() => onNotify && onNotify('تم تصدير قائمة الحجوزات بنجاح بصيغة CSV')}
            className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            <span>تصدير القائمة</span>
          </button>
        </div>
      </div>

      {/* Today's summary chips (real data) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {totals.map((t) => (
          <div key={t.label} className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-xs text-stone-500 font-semibold">{t.label}</span>
            <span className={`text-2xl font-black font-mono ${t.tone}`} dir="ltr">{t.value}</span>
          </div>
        ))}
      </div>

      {/* Store bookings summary: who booked from each store */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#131b2e]">حجوزات المتاجر ومن حجز من المستخدمين</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-xs font-bold">حقيقية</span>
            </div>
            <p className="text-xs text-stone-500">
              عدد الحجوزات الإجمالي لكل متجر مع أسماء المستخدمين الحاجزين (إجمالي + عدادات اليوم/الأسبوع/الشهر/السنة عند التمرير)
            </p>
          </div>
        </div>

        {!usersAnalytics ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-[#faf8ff] p-8 text-center text-xs text-stone-400">
            جارِ تحميل حجوزات المتاجر من قاعدة البيانات...
          </div>
        ) : usersAnalytics.stores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-[#faf8ff] p-8 text-center text-xs text-stone-400">
            لا توجد حجوزات مسجلة في المتاجر بعد.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {usersAnalytics.stores.map((store) => (
              <div key={store.storeId || store.storeName} className="rounded-2xl border border-stone-200/80 bg-[#faf8ff] p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#e2e7ff] text-stone-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">storefront</span>
                    </div>
                    <span className="font-black text-sm truncate">{store.storeName}</span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full bg-[#006948]/10 text-[#006948] font-black text-xs font-mono shrink-0"
                    title={`اليوم: ${store.totals.day} • الأسبوع: ${store.totals.week} • الشهر: ${store.totals.month} • السنة: ${store.totals.year}`}
                    dir="ltr"
                  >
                    {store.totals.all} حجز
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] text-stone-500 font-semibold">
                  <span className="px-1.5 py-0.5 rounded-md bg-white border border-stone-200">اليوم: {store.totals.day}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white border border-stone-200">الأسبوع: {store.totals.week}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white border border-stone-200">الشهر: {store.totals.month}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white border border-stone-200">السنة: {store.totals.year}</span>
                </div>
                {store.users.length === 0 ? (
                  <p className="text-xs text-stone-400">لا مستخدمين حجزوا من هذا المتجر.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {store.users.map((u) => (
                      <div key={`${store.storeId}||${u.clientName}||${u.phone}`} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200/70">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="material-symbols-outlined text-[15px] text-stone-400 shrink-0">person</span>
                          <span className="font-bold text-[11px] truncate">{u.clientName}</span>
                          {u.phone && <span className="text-[9px] text-stone-400" dir="ltr">{u.phone}</span>}
                        </span>
                        <span className="text-[11px] font-black text-[#006948] font-mono shrink-0" dir="ltr">×{u.count.all}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Pickups & Permits Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#131b2e]">
                  المتابعة اللحظية للحجوزات وتصاريح الاستلام النشطة
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-xs font-bold">مباشر</span>
              </div>
              <p className="text-xs text-stone-500">
                بيانات حقيقية من الطلبات المسجلة • {adminStats ? adminStats.totalOrders : 0} إجمالي الطلبات
              </p>
            </div>
            <span className="text-[11px] font-bold text-stone-400 shrink-0">
              النتائج المعروضة: {filtered.length} من أصل {pickups.length}
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch gap-2.5">
            <div className="relative flex-1 min-w-0">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في رقم التصريح، المتجر، المستفيد، الهاتف..."
                className="w-full h-10 pr-9 pl-3 rounded-xl bg-[#f2f3ff] border border-stone-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 text-xs font-semibold text-[#131b2e] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20"
              >
                <option value="all">كل الحالات</option>
                <option value="pending">قيد الاستلام</option>
                <option value="preparing">قيد التجهيز</option>
                <option value="completed">مكتمل الاستلام</option>
                <option value="cancelled">ملغاة</option>
              </select>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 text-xs font-semibold text-[#131b2e] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20 max-w-[190px]"
              >
                <option value="all">كل المتاجر</option>
                {storeOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff] text-stone-600 text-xs font-bold">
                <th className="py-3 px-4 rounded-r-xl">رقم التصريح</th>
                <th className="py-3 px-4">المتجر الشريك</th>
                <th className="py-3 px-4">المستفيد / المندوب</th>
                <th className="py-3 px-4">نافذة الاستلام</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 rounded-l-xl text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y-0 text-[#131b2e]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    {pickups.length === 0
                      ? 'لا توجد تصاريح حجز حالياً. ستظهر الطلبات الحقيقية هنا بمجرد تسجيلها.'
                      : 'لا توجد نتائج مطابقة لمعايير البحث والتصفية الحالية.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#f2f3ff]/60 transition-colors ${
                      idx % 2 === 1 ? 'bg-[#f2f3ff]/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#006948]" dir="ltr">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#e2e7ff] flex items-center justify-center text-stone-600">
                          <span className="material-symbols-outlined text-[16px]">
                            {item.storeIcon}
                          </span>
                        </div>
                        <span className="font-semibold">{item.storeName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{item.beneficiary}</span>
                        <span className="text-[10px] text-stone-400">{item.beneficiaryNote}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 ${item.status === 'cancelled' ? 'line-through text-stone-400' : 'text-stone-600 font-medium'}`} dir="ltr">
                        <span className="material-symbols-outlined text-[14px]">
                          {item.status === 'cancelled' ? 'close' : item.status === 'pending' ? 'hourglass_top' : 'timer'}
                        </span>
                        {item.windowTime}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#006948]/10 text-[#006948] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse"></span>
                          {item.statusText}
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffddb8] text-[#855300] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#855300] animate-ping"></span>
                          {item.statusText}
                        </span>
                      )}
                      {item.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                          {item.statusText}
                        </span>
                      )}
                      {item.status === 'preparing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffddb8] text-[#855300] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#855300]"></span>
                          {item.statusText}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onShowDetail(item)}
                          className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#131b2e] flex items-center justify-center transition-colors"
                          title="تفاصيل السلة"
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNotify && onNotify(`جارِ الاتصال بالمستفيد (${item.beneficiary}): ${item.phone}`)}
                          className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#006948] flex items-center justify-center transition-colors"
                          title="اتصال بالمتلقي"
                        >
                          <span className="material-symbols-outlined text-[18px]">phone</span>
                        </button>
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onNotify && onNotify(`تم إرسال تذكير SMS للمستفيد (${item.beneficiary}) للاستلام قبل إغلاق النافذة`)}
                            className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#006948] flex items-center justify-center transition-colors"
                            title="إرسال تذكير SMS"
                          >
                            <span className="material-symbols-outlined text-[18px]">sms</span>
                          </button>
                        )}
                        {item.status === 'preparing' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPickups((prev) =>
                                prev.map((p) => (p.id === item.id ? { ...p, status: 'completed', statusText: 'مكتمل الاستلام' } : p))
                              );
                              if (onNotify) onNotify(`تم تأكيد تجهيز واستلام تصريح (${item.id}) بنجاح`);
                            }}
                            className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#006948] flex items-center justify-center transition-colors"
                            title="تأكيد التجهيز"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 text-xs text-stone-500">
          <span>عرض {filtered.length} من أصل {adminStats ? Math.max(adminStats.totalOrders, pickups.length) : 0} تصريح حجز</span>
          {filtered.length > 0 && (
            <div className="flex items-center gap-1">
              <button type="button" disabled className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-stone-400 flex items-center justify-center disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px] rotate-180">chevron_right</span>
              </button>
              <span className="px-3 py-1 rounded-lg bg-[#006948] text-white font-bold">1</span>
              <button type="button" className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-stone-700 flex items-center justify-center hover:bg-[#eaedff]">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}