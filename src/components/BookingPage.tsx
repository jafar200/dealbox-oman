import React, { useState } from 'react';
import { DealBoxItem } from '../types';
import { applyLoyalty, useLoyaltyDiscount } from '../data/loyaltyApi';

interface BookingPageProps {
  box: DealBoxItem;
  onBack: () => void;
  onConfirm: (quantity: number) => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  box,
  onBack,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const loyaltyPct = useLoyaltyDiscount();
  const discountPercent = box.originalPrice > 0
    ? Math.round(((box.originalPrice - box.discountedPrice) / box.originalPrice) * 100)
    : 0;
  const remainingCount = Math.max(0, box.remainingCount);

  const unitPrice = applyLoyalty(box.discountedPrice, loyaltyPct);
  const totalPrice = unitPrice * quantity;

  return (
    <div dir="rtl" className="min-h-screen bg-[#faf8ff] text-[#131b2e]">
      <header className="sticky top-0 z-30 bg-[#faf8ff]/95 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between">
          <button
            type="button"
            aria-label="العودة"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f3ff] text-[#131b2e] transition-colors hover:bg-[#eaedff]"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <h1 className="text-[18px] font-bold">تفاصيل الصندوق</h1>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
            <img src={box.storeLogoUrl} alt="" className="h-8 w-8 object-contain" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-36 pt-3">
        <section className="relative h-64 overflow-hidden rounded-3xl bg-[#e2e7ff] shadow-md">
          <img
            src={box.imageUrl}
            alt={box.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between">
            <span className="flex items-center gap-1 rounded-full bg-[#fea619] px-3 py-1 text-[12px] font-bold text-[#684000] shadow-md">
              <span className="material-symbols-outlined text-[15px]">savings</span>
              وفرت {discountPercent}%
            </span>
            {box.verifiedStore && (
              <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">verified</span>
                متجر موثوق
              </span>
            )}
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 text-white">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[12px] text-white/90">
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span className="truncate">{box.storeName}</span>
              </div>
              <h2 className="text-[19px] font-bold leading-tight">{box.title}</h2>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-[12px] text-white/70 line-through">
                {Number(box.originalPrice).toFixed(3)} {box.currency}
              </span>
              <span className="text-[21px] font-black">
                {Number(unitPrice).toFixed(3)} {box.currency}
              </span>
              {loyaltyPct > 0 && (
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#a7f3d0] px-2 py-0.5 text-[10px] font-bold text-[#065f46]">
                  <span className="material-symbols-outlined text-[12px]">local_offer</span>
                  ولاء {loyaltyPct}% إضافي
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006948]/10 text-[#006948]">
              <span className="material-symbols-outlined text-[22px]">schedule</span>
            </span>
            <div className="flex flex-col">
              <span className="text-[12px] text-[#3d4a42]">نافذة الاستلام</span>
              <span className="text-[17px] font-bold text-[#006948]">{box.pickupTimeText}</span>
            </div>
          </div>
          <span className="rounded-full bg-[#ffddb8]/60 px-3 py-1 text-[12px] font-semibold text-[#684000]">
            {remainingCount > 0 ? `متوفر ${remainingCount}` : 'نفد المخزون'}
          </span>
        </section>

        <section className="rounded-2xl border border-[#bccac0]/70 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006948]/10 text-[#006948]">
              <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
            </span>
            <div>
              <h3 className="text-[14px] font-bold">رمز الاستلام</h3>
              <p className="text-[12px] text-[#3d4a42]">سيظهر رمزك بعد تأكيد الحجز</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f2f3ff] p-4">
            <span className="material-symbols-outlined text-[42px] text-[#006948]">lock</span>
            <p className="text-[13px] leading-6 text-[#3d4a42]">
              احتفظ برمز الاستلام وأبرزه لموظف المتجر عند استلام الصندوق.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2f3ff] text-[#006948]">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-bold">{box.storeName}</h3>
              <p className="truncate text-[12px] text-[#3d4a42]">{box.addressDetails}</p>
              <p className="mt-1 text-[12px] font-medium text-[#006948]">
                <span className="material-symbols-outlined align-middle text-[15px]">near_me</span>
                {' '}{box.distanceText}
              </p>
            </div>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2f3ff] text-[#006948]">
            <span className="material-symbols-outlined">map</span>
          </span>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[17px] font-bold">
              <span className="material-symbols-outlined text-[#006948]">inventory_2</span>
              محتويات الصندوق المتوقعة
            </h3>
            <span className="rounded-full bg-[#f2f3ff] px-3 py-1 text-[11px] text-[#3d4a42]">طازج اليوم</span>
          </div>
          <p className="text-[13px] leading-6 text-[#3d4a42]">{box.description}</p>
          {box.expectedItems.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {box.expectedItems.map((item) => (
                <li
                  key={item}
                  className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-[#f2f3ff] p-3 text-center"
                >
                  <span className="material-symbols-outlined text-[22px] text-[#006948]">bakery_dining</span>
                  <span className="text-[12px] leading-5">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-4 flex items-start gap-2 text-[13px] leading-6 text-[#3d4a42]">
            <span className="material-symbols-outlined shrink-0 text-[#855300]">volunteer_activism</span>
            حجزك للصندوق يساهم في حفظ النعمة وتقليل هدر الطعام. يمكنك الرجوع دون تأكيد في أي وقت.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#bccac0] text-[14px] font-semibold text-[#3d4a42] transition-colors hover:bg-[#f2f3ff]"
          >
            <span className="material-symbols-outlined text-[#ba1a1a]">close</span>
            العودة دون حجز
          </button>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eaedff] bg-[#faf8ff]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-[#f2f3ff] p-1">
            <button
              type="button"
              aria-label="تقليل الكمية"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2e7ff] text-[#006948] disabled:opacity-40"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="min-w-6 text-center text-[18px] font-bold">{quantity}</span>
            <button
              type="button"
              aria-label="زيادة الكمية"
              disabled={quantity >= remainingCount}
              onClick={() => setQuantity((current) => Math.min(remainingCount, current + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#006948] text-white disabled:opacity-40"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <button
            type="button"
            disabled={remainingCount === 0}
            onClick={() => onConfirm(quantity)}
            className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#006948] px-3 text-[14px] font-bold text-white shadow-md transition-colors hover:bg-[#00855d] disabled:cursor-not-allowed disabled:bg-[#6d7a72]"
          >
            <span className="material-symbols-outlined shrink-0">shopping_bag</span>
            <span className="truncate">تأكيد الحجز · {totalPrice.toFixed(3)} {box.currency}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
