import React, { useMemo, useState } from 'react';
import { AdminPeriodCounts, AdminUsersAnalyticsData } from '../types';

type PeriodKey = keyof AdminPeriodCounts;

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'day', label: 'اليوم' },
  { key: 'week', label: 'الأسبوع' },
  { key: 'month', label: 'الشهر' },
  { key: 'year', label: 'السنة' },
];

interface AdminUsersSectionProps {
  data: AdminUsersAnalyticsData | null;
  onNotify?: (msg: string) => void;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('ar-OM', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function AdminUsersSection({ data, onNotify }: AdminUsersSectionProps) {
  const [period, setPeriod] = useState<PeriodKey>('all');

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || 'الكل';

  const sortedUsers = useMemo(
    () => (data ? [...data.users] : []),
    [data]
  );

  const summaryChips = [
    { label: 'إجمالي المستخدمين', value: data ? data.summary.totalUsers : 0, tone: 'text-[#131b2e]', icon: 'group' },
    { label: 'إجمالي الحجوزات', value: data ? data.summary.totalBookings : 0, tone: 'text-[#006948]', icon: 'fact_check' },
    { label: 'مستخدمون نشطون اليوم', value: data ? data.summary.activeToday : 0, tone: 'text-[#855300]', icon: 'bolt' },
    { label: 'متاجر لديها حجوزات', value: data ? data.summary.totalStores : 0, tone: 'text-[#131b2e]', icon: 'storefront' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-[#131b2e]">قائمة المستخدمين</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-xs font-bold">بيانات حقيقية</span>
          </div>
          <p className="text-xs text-stone-500">
            دليل المستفيدين المسجلين والزوار مع عدد حجوزاتهم من كل متجر — حسب اليوم، الأسبوع، الشهر، والسنة
          </p>
        </div>
        {/* Period selector */}
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
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {summaryChips.map((c) => (
          <div key={c.label} className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#e2e7ff] text-[#131b2e] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">{c.icon}</span>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={`text-2xl font-black font-mono ${c.tone}`} dir="ltr">{c.value}</span>
              <span className="text-xs text-stone-500 font-semibold">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base sm:text-lg font-black text-[#131b2e]">حجوزات المستخدمين حسب المتجر</h2>
            <p className="text-xs text-stone-500">
              عداد الحجوزات المعروض أدناه حسب فترة «{periodLabel}» — البيانات من الطلبات الحقيقية مباشرة
            </p>
          </div>
        </div>

        {!data ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-[#faf8ff] p-8 text-center text-xs text-stone-400">
            جارِ تحميل تحليلات المستخدمين من قاعدة البيانات...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#f2f3ff] text-stone-600 text-xs font-bold">
                  <th className="py-3 px-4 rounded-r-xl">المستخدم</th>
                  <th className="py-3 px-4">حجوزات {periodLabel}</th>
                  <th className="py-3 px-4">إجمالي الحجوزات</th>
                  <th className="py-3 px-4">حجوزات من المتاجر</th>
                  <th className="py-3 px-4 rounded-l-xl">آخر حجز</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y-0 text-[#131b2e]">
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      لا يوجد مستخدمون بعد. ستظهر الحسابات والحجوزات هنا فور تسجيلها.
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((user, idx) => (
                    <tr
                      key={user.clientId || `${user.clientName}||${user.clientPhone}`}
                      className={`hover:bg-[#f2f3ff]/60 transition-colors ${idx % 2 === 1 ? 'bg-[#f2f3ff]/30' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#e2e7ff] text-stone-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold">{user.clientName}</span>
                            <span className="text-[10px] text-stone-400" dir="ltr">
                              {user.clientPhone || (user.email ? user.email : 'بدون هاتف')}
                            </span>
                          </div>
                          {user.registered ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-[10px] font-bold shrink-0">
                              مسجل
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold shrink-0">
                              زائر
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#006948]/10 text-[#006948] font-black font-mono" dir="ltr">
                          {user.totals[period]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-[#131b2e]" dir="ltr">{user.totals.all}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {user.byStore.length === 0 ? (
                          <span className="text-stone-400 text-[11px]">لا حجوزات بعد</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {user.byStore.map((s) => (
                              <span
                                key={s.storeId || s.storeName}
                                title={`إجمالي: ${s.count.all} حجز من هذا المتجر`}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.count[period] > 0 ? 'bg-[#e2e7ff] text-[#131b2e]' : 'bg-stone-100 text-stone-400'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[13px]">storefront</span>
                                {s.storeName}
                                <span className="font-mono" dir="ltr">×{s.count[period]}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-medium">{formatDate(user.lastBookingAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Store breakdown: who booked from each store */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base sm:text-lg font-black text-[#131b2e]">حجوزات المتاجر ومن حجز من المستخدمين</h2>
            <p className="text-xs text-stone-500">
              كل متجر وعدد حجوزاته في فترة «{periodLabel}» مع قائمة المستخدمين الحاجزين (عدادات كاملة لكل فترة)
            </p>
          </div>
        </div>

        {!data ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-[#faf8ff] p-8 text-center text-xs text-stone-400">
            جارِ تحميل بيانات المتاجر...
          </div>
        ) : data.stores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-[#faf8ff] p-8 text-center text-xs text-stone-400">
            لا توجد حجوزات مسجلة في المتاجر بعد.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.stores.map((store) => (
              <div key={store.storeId || store.storeName} className="rounded-2xl border border-stone-200/80 bg-[#faf8ff] p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#e2e7ff] text-stone-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[17px]">storefront</span>
                    </div>
                    <span className="font-black text-sm truncate">{store.storeName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-[#006948]/10 text-[#006948] font-black text-xs font-mono" dir="ltr">
                      {store.totals[period]} {periodLabel === 'الكل' ? 'حجز' : `حجز (${periodLabel})`}
                    </span>
                  </div>
                </div>
                {store.users.length === 0 ? (
                  <p className="text-xs text-stone-400">لا مستخدمين حجزوا من هذا المتجر.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {store.users.map((u) => (
                      <div key={`${store.storeId}||${u.clientName}||${u.phone}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-stone-200/70">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-stone-400">person</span>
                          <span className="font-bold text-xs truncate">{u.clientName}</span>
                          {u.phone && <span className="text-[10px] text-stone-400" dir="ltr">{u.phone}</span>}
                        </div>
                        <span className="text-[11px] font-black text-[#006948] font-mono shrink-0" dir="ltr">
                          {u.count[period]} {periodLabel === 'الكل' ? 'حجز' : `/${periodLabel}`}
                          {period !== 'all' && u.count.all !== u.count[period] && (
                            <span className="text-stone-400 font-medium"> · إجمالي {u.count.all}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh hint */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs text-xs">
        <span className="text-stone-500 font-medium">
          الأرقام تُشتق لحظياً من الطلبات الحقيقية — لا توجد بيانات ثابتة أو مؤقتة.
        </span>
        <button
          type="button"
          onClick={() => onNotify && onNotify('تمت مزامنة تحليلات المستخدمين والحجوزات من قاعدة البيانات')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold hover:bg-[#eaedff] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          إعادة مزامنة
        </button>
      </div>
    </div>
  );
}