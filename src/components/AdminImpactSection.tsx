import React from 'react';
import { AdminAnalyticsData } from '../types';

interface AdminImpactSectionProps {
  adminStats: AdminAnalyticsData | null;
  onNotify?: (msg: string) => void;
}

export function AdminImpactSection({ adminStats, onNotify }: AdminImpactSectionProps) {
  const weekly = adminStats?.weekly?.length ? adminStats.weekly : [];
  const maxSales = weekly.reduce((m, d) => Math.max(m, d.salesOmr), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg sm:text-xl font-black text-[#131b2e]">تقارير الأثر وهدر الطعام</h1>
          <p className="text-xs text-stone-500">
            أثر إنقاذ الغذاء الحقيقي — الوجبات المنقذة، المبيعات، والطلبات غير الملغاة من قاعدة البيانات
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNotify && onNotify('تم تصدير تقرير الأثر الشامل بصيغة PDF')}
          className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          <span>تصدير التقرير</span>
        </button>
      </div>

      {/* Impact KPI cards (real data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Rescued Meals */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-stone-500 font-semibold">إجمالي الوجبات المنقذة</span>
              <span className="text-3xl font-black text-[#131b2e] font-mono tracking-tight" dir="ltr">
                {adminStats ? adminStats.mealsRescued.toLocaleString('en-US') : '—'}
              </span>
              <span className="text-[11px] text-stone-400">
                {adminStats ? `من ${adminStats.totalOrders} طلباً مسجلاً` : 'وجبة جاهزة صالحة للاستهلاك'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">eco</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[#006948] font-bold">
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
              {adminStats ? `${adminStats.nonCancelledPct}%` : '—'} طلبات غير ملغاة
            </span>
            <span className="text-stone-400 text-[11px]">إجمالي النسبة من الطلبات</span>
          </div>
        </div>

        {/* Card 2: Gross Store Sales */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-stone-500 font-semibold">إجمالي مبيعات المتاجر</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#006948] font-mono" dir="ltr">
                  {adminStats ? adminStats.grossSalesOmr.toLocaleString('en-US', { minimumFractionDigits: 3 }) : '—'}
                </span>
                <span className="text-xs text-stone-500 font-medium">ر.ع</span>
              </div>
              <span className="text-[11px] text-stone-400">صافي حصيلة المتاجر الشريكة</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#e2e7ff] text-[#131b2e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">payments</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-xs text-stone-500">
            <span>عمولة المنصة (15%):</span>
            <span className="font-bold text-[#131b2e]" dir="ltr">
              {adminStats ? adminStats.platformCommissionOmr.toLocaleString('en-US', { minimumFractionDigits: 3 }) : '—'} ر.ع
            </span>
          </div>
        </div>

        {/* Card 3: Active Stores */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-stone-500 font-semibold">المتاجر والمخازن النشطة</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#131b2e] font-mono" dir="ltr">
                  {adminStats ? adminStats.activeStores : 0}
                </span>
                <span className="text-xs text-stone-500 font-medium">من أصل {adminStats ? adminStats.totalStores : 0} شريك</span>
              </div>
              <span className="text-[11px] text-stone-400">شبكة إنقاذ الغذاء في سلطنة عُمان</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#e2e7ff] text-[#131b2e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">storefront</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00855b]"></span>
              {adminStats && adminStats.totalStores > 0
                ? `${Math.round((adminStats.activeStores / adminStats.totalStores) * 100)}% متاجر نشطة`
                : '— متاجر نشطة'}
            </span>
            <span className="font-bold text-[#006948]">سلطنة عُمان</span>
          </div>
        </div>

        {/* Card 4: Total Orders & Cancellation */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-stone-500 font-semibold">إجمالي الطلبات</span>
              <span className="text-3xl font-black text-[#131b2e] font-mono" dir="ltr">
                {adminStats ? adminStats.totalOrders : 0}
              </span>
              <span className="text-[11px] text-stone-400">حجم طلبات إنقاذ الغذاء المسجلة</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#e2e7ff] text-[#131b2e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">inventory_2</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006948]"></span>
              {adminStats ? adminStats.todayStat.collected : 0} مكتمل اليوم
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">
              {adminStats ? adminStats.todayStat.cancelled : 0} ملغاة اليوم
            </span>
          </div>
        </div>
      </div>

      {/* Weekly store sales flow chart (real data) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base sm:text-lg font-black text-[#131b2e]">
              معدل تدفق مبيعات المتاجر الأسبوعي
            </h2>
            <p className="text-xs text-stone-500">
              حجم مبيعات المتاجر بالريال العماني خلال آخر 7 أيام (بيانات حقيقية من الطلبات غير الملغاة)
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f2f3ff] text-stone-700 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-amber-600">schedule</span>
              إجمالي {adminStats ? adminStats.grossSalesOmr.toLocaleString('en-US', { minimumFractionDigits: 3 }) : '—'} ر.ع
            </span>
          </div>
        </div>

        {/* Inline Visual Bar Chart (real weekly data) */}
        <div className="w-full flex flex-col gap-3 pt-3">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 h-56 items-end px-2">
            {weekly.length === 0 ? (
              <div className="col-span-7 text-center text-xs text-stone-400 py-10">
                لا توجد بيانات مبيعات أسبوعية بعد.
              </div>
            ) : (
              weekly.map((day) => {
                const isPeak = day.isPeak;
                const pct = maxSales > 0 ? Math.max((day.salesOmr / maxSales) * 95, 3) : 3;
                return (
                  <div key={day.day} className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                    <div className={`text-[11px] ${isPeak ? 'text-[#006948] font-bold opacity-100' : 'text-stone-500 opacity-0 group-hover:opacity-100'} transition-opacity whitespace-nowrap font-mono`}>
                      {day.salesOmr > 0 ? `${day.salesOmr.toLocaleString('en-US', { maximumFractionDigits: 3 })} ر.ع` : '0'} {isPeak ? '⭐' : ''}
                    </div>
                    <div
                      className={`w-full max-w-[48px] rounded-xl transition-colors ${isPeak ? 'bg-[#006948] shadow-xs relative' : 'bg-[#e2e7ff] group-hover:bg-[#85f8c4]'}`}
                      style={{ height: `${pct}%` }}
                    >
                      {isPeak && <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#fea619]"></span>}
                    </div>
                    <span className={`text-xs ${isPeak ? 'font-bold text-[#006948]' : 'text-stone-500 font-medium'}`}>{day.day}</span>
                    <span className="text-[10px] text-stone-400">{day.ordersCount} طلب</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Axis baseline & legends */}
          <div className="h-1 w-full bg-[#e2e7ff] rounded-full mt-2"></div>
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-2 px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#006948]"></span>
                ذروة المبيعات
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#e2e7ff]"></span>
                المعدل الاعتيادي
              </span>
            </div>
            <div className="flex items-center gap-1 text-stone-400 text-[11px]">
              <span className="material-symbols-outlined text-[16px]">info</span>
              بيانات حقيقية مباشرة من الطلبات • {adminStats ? adminStats.totalOrders : 0} طلب
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}