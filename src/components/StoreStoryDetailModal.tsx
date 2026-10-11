import React, { useEffect, useState } from 'react';
import { DealBoxItem } from '../types';
import { StoreAvatar } from './StoreAvatar';

export interface ApprovedStoreStory {
  id: string;
  storeId: string;
  storeName: string;
  storeLogoUrl: string;
  category: DealBoxItem['category'];
  imageData: string;
  caption: string;
  expiresAt: string;
}

interface StoreStoryDetailModalProps {
  /** كل القصص بنفس الترتيب داخل الصفحة، تُعرض واحدة تلو الأخرى. */
  stories: ApprovedStoreStory[];
  /** الفهرس الذي يبدأ منه العارض (القصة التي نقرها المستخدم). */
  initialIndex: number;
  onClose: () => void;
  onClaim: (box: DealBoxItem) => void;
  isClaimed: (boxId: string) => boolean;
}

const categoryNames: Record<DealBoxItem['category'], string> = {
  all: 'عام',
  bakery: 'مخبوزات ومعجنات',
  supermarket: 'سوبرماركت وأغذية',
  restaurant: 'مطاعم ووجبات',
  cooked: 'وجبات مطبوخة',
  cafe: 'مقاهي وحلويات',
  produce: 'خضار وفواكه',
};

/**
 * عارض قصص بأسلوب Instagram: إطار كامل 9:16، شريط تقدّم، والتنقّل بالنقر
 * يمين/يسار بين القصص. داخل كل قصة يوجد زر لحجز حقيبة المتجر.
 */
export const StoreStoryDetailModal: React.FC<StoreStoryDetailModalProps> = ({
  stories,
  initialIndex,
  onClose,
  onClaim,
  isClaimed,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [boxes, setBoxes] = useState<DealBoxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const story = stories[currentIndex];

  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, stories.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage('');

    fetch(`/api/v1/client/stores/${story.storeId}/boxes`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر تحميل حقائب المتجر');
        const mappedBoxes: DealBoxItem[] = (result.boxes || []).map((box: any) => ({
          id: String(box._id),
          storeId: story.storeId,
          storeName: story.storeName,
          storeLogoUrl: story.storeLogoUrl,
          imageUrl: box.imageUrl,
          category: box.category,
          categoryNameAr: categoryNames[box.category as DealBoxItem['category']] || 'حقائب متنوعة',
          title: box.title,
          description: box.description,
          expectedItems: box.expectedItems || [],
          remainingCount: box.remainingCount,
          remainingText: `متوفر ${box.remainingCount}`,
          distanceKm: 0,
          distanceText: 'من هذا المتجر',
          pickupTimeText: `${box.pickupDate || 'اليوم'} ${box.pickupStart} - ${box.pickupEnd}`,
          pickupWindow: `${box.pickupStart} - ${box.pickupEnd}`,
          originalPrice: box.originalPrice,
          discountedPrice: box.discountedPrice,
          currency: box.currency || 'ر.ع',
          locationArea: 'سلطنة عُمان',
          coordinates: [23.6139, 58.1963],
          addressDetails: 'يرجى مراجعة عنوان المتجر عند تأكيد الحجز',
          verifiedStore: true,
        }));
        if (isActive) setBoxes(mappedBoxes);
      })
      .catch((error: unknown) => {
        if (isActive) setErrorMessage(error instanceof Error ? error.message : 'تعذر تحميل حقائب المتجر');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
  }, [story.storeId, story.storeName, story.storeLogoUrl]);

  if (!story) return null;

  const firstBox = boxes[0];
  const claimed = firstBox ? isClaimed(firstBox.id) : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`قصة ${story.storeName}`}
      onClick={onClose}
    >
      {/* 9:16 story frame — Instagram story aspect ratio */}
      <div
        className="relative aspect-[9/16] h-full max-h-[92vh] w-auto max-w-[430px] overflow-hidden bg-black shadow-2xl sm:rounded-3xl"
        dir="rtl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* progress segments — one per story */}
        <div className="absolute inset-x-0 top-0 z-30 flex items-center gap-1 p-3">
          {stories.map((item, i) => (
            <div key={item.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/40">
              <div className={`h-full bg-white transition-all ${i <= currentIndex ? 'w-full' : 'w-0'}`} />
            </div>
          ))}
        </div>

        {/* store header */}
        <header className="absolute inset-x-0 top-4 z-30 flex items-center gap-2.5 px-4 pt-3">
          <StoreAvatar
            name={story.storeName}
            logoUrl={story.storeLogoUrl}
            fallbackImageUrl={story.imageData}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
            initialsClassName="bg-[#006948] text-sm font-bold text-white"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black text-white drop-shadow">{story.storeName}</h2>
            <p className="text-[11px] text-white/80">{currentIndex + 1} / {stories.length}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/30 backdrop-blur-md hover:bg-black/60"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* story image */}
        <img
          src={story.imageData}
          alt={`قصة ${story.storeName}`}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />

        {/* tap zones — right = السابقة، left = التالية */}
        <button type="button" aria-label="القصة السابقة" onClick={goPrev} className="absolute inset-y-0 right-0 w-1/2 cursor-pointer" />
        <button type="button" aria-label="القصة التالية" onClick={goNext} className="absolute inset-y-0 left-0 w-1/2 cursor-pointer" />

        {/* caption */}
        <p className="absolute inset-x-0 bottom-28 z-20 px-5 text-xl font-black leading-snug text-white drop-shadow-lg">
          {story.caption}
        </p>

        {/* booking CTA */}
        <div className="absolute inset-x-0 bottom-5 z-20 px-4">
          {isLoading ? (
            <div className="rounded-full bg-white/20 py-3.5 text-center text-sm font-medium text-white backdrop-blur-md">
              جارٍ تحميل الحقائب...
            </div>
          ) : errorMessage ? (
            <div className="rounded-full bg-red-500/80 py-3.5 text-center text-sm font-medium text-white">
              {errorMessage}
            </div>
          ) : firstBox ? (
            <button
              type="button"
              onClick={() => onClaim(firstBox)}
              disabled={claimed}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-black text-white shadow-xl transition active:scale-[0.98] ${claimed ? 'bg-stone-500/80' : 'bg-[#006948] hover:bg-[#005d3f]'}`}
            >
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              {claimed ? 'محجوز بالفعل' : `احجز الصندوق · ${firstBox.discountedPrice} ر.ع`}
            </button>
          ) : (
            <div className="rounded-full bg-stone-800/60 py-3.5 text-center text-sm font-medium text-white backdrop-blur-md">
              لا توجد حقائب متاحة لهذا المتجر حالياً
            </div>
          )}
        </div>
      </div>
    </div>
  );
};