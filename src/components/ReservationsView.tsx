import React from 'react';
import { Reservation } from '../types';

interface ReservationsViewProps {
  reservations: Reservation[];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onBrowse: () => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  reservations,
  onComplete,
  onCancel,
  onBrowse,
}) => {
  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#131b2e]">
            حجوزاتي وصناديقي المحفوظة
          </h2>
          <p className="text-[12px] text-[#3d4a42]">
            أظهر كود الاستلام للمتجر في النافذة المحددة
          </p>
        </div>
        <span className="text-[12px] font-semibold text-[#006948] bg-[#f2f3ff] px-3 py-1 rounded-full">
          {reservations.filter(r => r.status === 'pending').length} نشط
        </span>
      </div>

      {/* List */}
      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#bccac0]/30 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#f2f3ff] text-[#006948] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[32px]">
              shopping_bag
            </span>
          </div>
          <h3 className="text-base font-bold text-[#131b2e] mb-1">
            لا توجد لديك حجوزات حالية
          </h3>
          <p className="text-[12px] text-[#3d4a42] max-w-xs mx-auto mb-5">
            استكشف الصناديق الفائضة المتاحة بالقرب منك اليوم ووفر حتى 70% مع حماية البيئة.
          </p>
          <button
            onClick={onBrowse}
            className="px-6 py-2.5 rounded-xl bg-[#006948] text-white text-[13px] font-semibold hover:bg-[#00855d] transition-all shadow-xs"
          >
            تصفح الصناديق المتاحة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reservations.map((res) => {
            const isCompleted = res.status === 'completed';
            return (
              <div 
                key={res.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                  isCompleted 
                    ? 'border-[#eaedff] opacity-80' 
                    : 'border-[#006948]/40'
                }`}
              >
                {/* Store & status */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#eaedff]">
                  <div>
                    <h4 className="font-bold text-[15px] text-[#131b2e]">
                      {res.storeName}
                    </h4>
                    <p className="text-[12px] text-[#3d4a42]">
                      {res.title}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    isCompleted
                      ? 'bg-stone-100 text-stone-600'
                      : 'bg-[#f5fff6] text-[#006948] border border-[#006948]/30'
                  }`}>
                    {isCompleted ? 'تم الاستلام بنجاح' : 'جاهز للاستلام 🟢'}
                  </span>
                </div>

                {/* PIN Code Box */}
                {!isCompleted && (
                  <div className="my-3 p-3 rounded-xl bg-[#f2f3ff] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#3d4a42] font-medium">
                        كود الاستلام لدى الكاشير:
                      </div>
                      <div className="text-[22px] font-black font-mono tracking-widest text-[#006948]">
                        {res.pickupCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#bccac0]/30 text-[11px] font-semibold text-[#131b2e]">
                      <span className="material-symbols-outlined text-[18px] text-[#006948]">
                        qr_code_2
                      </span>
                      <span>QR جاهز</span>
                    </div>
                  </div>
                )}

                {/* Meta details */}
                <div className="space-y-1.5 text-[12px] text-[#3d4a42] py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#006948]">
                      schedule
                    </span>
                    <span>موعد الاستلام: {res.pickupTimeWindow}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#006948]">
                      location_on
                    </span>
                    <span className="truncate">{res.addressDetails}</span>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="mt-3 pt-3 border-t border-[#eaedff] flex items-center justify-between gap-2">
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400">القيمة:</span>
                    <span className="text-[14px] font-bold text-[#006948] mr-1.5 font-mono">
                      {Number(res.pricePaid).toFixed(3)} {res.currency}
                    </span>
                  </div>

                  {!isCompleted && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onCancel(res.id)}
                        className="text-[12px] text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => onComplete(res.id)}
                        className="h-9 px-3.5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-[12px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          check_circle
                        </span>
                        <span>تأكيد الاستلام</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
