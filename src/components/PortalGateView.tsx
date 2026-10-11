import React from 'react';
import { PortalMode } from '../types';

interface PortalGateViewProps {
  onSelectPortal: (portal: PortalMode) => void;
  projectLogo?: string | null;
}

export const PortalGateView: React.FC<PortalGateViewProps> = ({ onSelectPortal, projectLogo }) => {
  const portals = [
    {
      id: 'store-dashboard' as PortalMode,
      queryParam: 'store',
      title: 'لوحة تحكم المتجر والشريك',
      subdomain: 'partner.dealbox.om',
      role: 'مسؤول المتجر / الكاشير',
      badge: 'بوابة الشركاء',
      badgeColor: 'bg-amber-100 text-[#855300]',
      icon: 'storefront',
      description:
        'مخصصة لأجهزة التابلت والكاشير بالمخابز والمقاهي للتحقق من كود الحجز وتعديل كميات السلال الفائضة يومياً.',
      features: [
        'أداة مسح والتحقق من كود الاستلام',
        'تعديل الكميات المتبقية بضغطة زر',
        'كشف المبيعات وصافي الأرباح المستحقة',
      ],
      btnText: 'دخول لوحة المتجر',
      btnColor: 'bg-[#855300] hover:bg-[#684000]',
    },
    {
      id: 'admin-dashboard' as PortalMode,
      queryParam: 'admin',
      title: 'لوحة تحكم الإدارة المركزية',
      subdomain: 'admin.dealbox.om',
      role: 'مشرف العمليات الميدانية',
      badge: 'الإدارة العليا',
      badgeColor: 'bg-indigo-100 text-indigo-900',
      icon: 'admin_panel_settings',
      description:
        'منصة رقابة شاملة لإدارة المتاجر المعتمدة في سلطنة عمان، السعة التخزينية للمستودعات، والتسويات المالية الأسبوعية.',
      features: [
        'مؤشرات الأداء الحي وإحصائيات الهدر',
        'اعتماد المتاجر الجديدة ورقم السجل التجاري',
        'أوامر التحويل البنكي والتسويات (Settlements)',
      ],
      btnText: 'دخول لوحة الآدمن',
      btnColor: 'bg-[#131b2e] hover:bg-[#283044]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] py-12 px-4 sm:px-6 font-['IBM_Plex_Sans_Arabic','IBM_Plex_Sans',sans-serif]" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* العودة إلى الموقع التسويقي */}
        <button
          type="button"
          onClick={() => onSelectPortal('marketing')}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e2f2] bg-white px-3.5 py-2 text-[12px] font-bold text-[#3d4a42] shadow-xs transition hover:border-[#006948]/40 hover:bg-[#eefaf1] hover:text-[#006948]"
        >
          <span className="material-symbols-outlined text-[15px] rotate-180">arrow_right_alt</span>
          DealBox · الصفحة التسويقية
        </button>
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            {projectLogo ? (
              <img
                src={projectLogo}
                alt="شعار المشروع"
                className="w-16 h-16 rounded-2xl object-contain bg-white p-2 shadow-md border border-stone-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#006948] text-white flex items-center justify-center font-black text-2xl shadow-md">
                DB
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f2f3ff] text-[#006948] text-xs font-bold border border-[#eaedff]">
            <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse"></span>
            <span>معمارية النظام المستقل (Subdomains & Role-Based Portals)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#131b2e] tracking-tight">
            بوابة تسجيل الدخول واختيار النظام
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto">
            تم فصل المنظومة إلى بوابتين مستقلتين تماماً ومحميتين بصلاحيات الدخول. يمكنك الدخول لأي بوابة الآن كجلسة منفصلة:
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header of card */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#f2f3ff] text-[#006948] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-[#131b2e]">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                    <span>الصلاحية:</span>
                    <span className="font-semibold text-stone-700">{item.role}</span>
                  </div>
                </div>

                {/* Subdomain pill */}
                <div className="p-2 rounded-xl bg-[#f2f3ff] flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-500 text-[10px]">النطاق المخصص:</span>
                  <span className="text-[#006948] font-bold" dir="ltr">{item.subdomain}</span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {item.description}
                </p>

                {/* Features list */}
                <ul className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-700">
                  {item.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#006948]">
                        check_circle
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => onSelectPortal(item.id)}
                  className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs ${item.btnColor}`}
                >
                  <span>{item.btnText}</span>
                  <span className="material-symbols-outlined text-[16px] rotate-180">arrow_right_alt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
