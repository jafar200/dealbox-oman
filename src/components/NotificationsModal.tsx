import React from 'react';

interface NotificationsModalProps {
  onClose: () => void;
  announcement?: { title: string; body: string; publishedAt: string | null } | null;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, announcement }) => {
  const alerts = [
    {
      id: '1',
      title: 'صناديق طازجة جديدة في مسقط!',
      desc: 'أضاف مخبز مسقط النور - فرع الخوض 4 صناديق مخبوزات جديدة اليوم.',
      time: 'منذ 15 دقيقة',
      icon: 'bakery_dining',
      read: false
    },
    {
      id: '2',
      title: 'أسواق البركة العُمانية - حسم إضافي',
      desc: 'باقي صندوقين فقط من خضار وفواكه مزارع الباطنة العمانية.',
      time: 'منذ 45 دقيقة',
      icon: 'shopping_basket',
      read: true
    },
    {
      id: '3',
      title: 'أثرك البيئي الأسبوعي في عُمان ممتاز 🌿',
      desc: 'وفّرت هذا الأسبوع 8.4 كجم من الطعام وتفاديت 21 كجم من انبعاثات الكربون.',
      time: 'أمس',
      icon: 'eco',
      read: true
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#bccac0]/30 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">
              notifications
            </span>
            <h3 className="font-bold text-base text-[#131b2e]">
              التنبيهات الفورية
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="py-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {announcement && (
            <div className="p-3 rounded-xl border border-[#006948]/30 bg-gradient-to-l from-[#eefaf1] to-[#f2f3ff] text-right">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#006948] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">
                    campaign
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[12px] font-black text-[#131b2e]">
                      {announcement.title}
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono">
                      الآن
                    </span>
                  </div>
                  <p className="text-[11px] text-[#3d4a42] mt-0.5 leading-relaxed">
                    {announcement.body}
                  </p>
                </div>
              </div>
            </div>
          )}
          {alerts.map((a) => (
            <div 
              key={a.id}
              className={`p-3 rounded-xl border text-right transition-all ${
                !a.read 
                  ? 'bg-[#f5fff6] border-[#006948]/30' 
                  : 'bg-white border-stone-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#006948] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">
                    {a.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-bold text-[#131b2e]">
                      {a.title}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {a.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#3d4a42] mt-0.5 leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
