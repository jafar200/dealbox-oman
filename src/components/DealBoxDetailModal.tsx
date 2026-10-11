import React, { useState } from 'react';
import { DealBoxItem } from '../types';
import { applyLoyalty, useLoyaltyDiscount } from '../data/loyaltyApi';

interface DealBoxDetailModalProps {
  box: DealBoxItem | null;
  onClose: () => void;
  onConfirmClaim: (box: DealBoxItem, quantity: number) => void;
}

export const DealBoxDetailModal: React.FC<DealBoxDetailModalProps> = ({
  box,
  onClose,
  onConfirmClaim,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loyaltyPct = useLoyaltyDiscount();

  if (!box) return null;

  const totalPrice = applyLoyalty(box.discountedPrice, loyaltyPct) * quantity;
  const totalOriginal = (box.originalPrice * quantity);
  const totalSavings = totalOriginal - totalPrice;

  const handleClaim = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmClaim(box, quantity);
      setIsSubmitting(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="dealbox-detail-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#bccac0]/30 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative w-full h-52 bg-stone-100">
          <img 
            src={box.imageUrl} 
            alt={box.title} 
            className="w-full h-full object-cover"
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              close
            </span>
          </button>

          {/* Badges */}
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 text-[#131b2e] text-[11px] font-semibold backdrop-blur-md shadow-xs">
            {box.remainingText}
          </span>

          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-[#283044]/80 text-[#eef0ff] text-[11px] backdrop-blur-md">
            {box.distanceText}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[55vh] text-[#131b2e]">
          {/* Store & Time row */}
          <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
            <div className="flex items-center gap-2">
              <img 
                src={box.storeLogoUrl} 
                alt={box.storeName} 
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#bccac0]"
              />
              <div>
                <h4 className="font-bold text-sm text-[#131b2e] leading-tight">
                  {box.storeName}
                </h4>
                <p className="text-[11px] text-[#3d4a42]">
                  {box.locationArea}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[12px] text-[#006948] font-medium bg-[#f2f3ff] px-2.5 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">
                schedule
              </span>
              <span>{box.pickupTimeText}</span>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xl font-bold text-[#131b2e] mb-1">
              {box.title}
            </h3>
            <p className="text-[13px] text-[#3d4a42] leading-relaxed">
              {box.description}
            </p>
          </div>

          {/* Expected Items */}
          <div className="bg-[#f2f3ff] rounded-2xl p-3.5 border border-[#eaedff]">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#131b2e] mb-2">
              <span className="material-symbols-outlined text-[#006948] text-[18px]">
                inventory_2
              </span>
              <span>المحتويات المتوقعة داخل الصندوق:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12px] text-[#3d4a42]">
              {box.expectedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#bccac0]/20">
                  <span className="material-symbols-outlined text-[#006948] text-[16px]">
                    check_circle
                  </span>
                  <span className="font-medium text-[12px] text-[#131b2e]">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#6d7a72] mt-2">
              * الصندوق يحتوي على فائض طازج من إنتاج اليوم بنفس معايير الجودة والمذاق.
            </p>
          </div>

          {/* Store Address */}
          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff] flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#006948] text-[20px] shrink-0 mt-0.5">
              location_on
            </span>
            <div>
              <span className="text-[12px] font-bold text-[#131b2e] block">عنوان الاستلام:</span>
              <span className="text-[12px] text-[#3d4a42]">{box.addressDetails}</span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3 bg-[#f2f3ff] rounded-xl">
            <span className="text-[13px] font-bold text-[#131b2e]">عدد الصناديق:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-white border border-[#bccac0]/40 text-[#131b2e] font-bold disabled:opacity-40 flex items-center justify-center active:scale-95"
              >
                -
              </button>
              <span className="font-bold text-base font-mono w-5 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(box.remainingCount, quantity + 1))}
                disabled={quantity >= box.remainingCount}
                className="w-8 h-8 rounded-lg bg-white border border-[#bccac0]/40 text-[#131b2e] font-bold disabled:opacity-40 flex items-center justify-center active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#faf8ff] border-t border-[#eaedff] flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-[#3d4a42]">الإجمالي:</div>
            <div className="text-[20px] font-black text-[#006948] font-mono leading-none">
              {totalPrice.toFixed(3)} <span className="text-[13px] font-sans font-bold">{box.currency}</span>
            </div>
            <div className="text-[11px] text-[#855300] font-medium mt-0.5">
              وفرت {totalSavings.toFixed(3)} {box.currency}
            </div>
            {loyaltyPct > 0 && (
              <div className="mt-0.5 text-[11px] font-bold text-[#006948]">
                خصم ولاء +{loyaltyPct}% إضافي مُفعّل
              </div>
            )}
          </div>

          <button
            id="modal-confirm-btn"
            type="button"
            onClick={handleClaim}
            disabled={isSubmitting}
            className="flex-1 max-w-[200px] h-11 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
                <span>جارِ الحجز...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  shopping_bag
                </span>
                <span>تأكيد الحجز</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
