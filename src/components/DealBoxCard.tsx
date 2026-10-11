import React, { useState } from 'react';
import { DealBoxItem } from '../types';

interface DealBoxCardProps {
  box: DealBoxItem;
  onOpenDetails: (box: DealBoxItem) => void;
  onClaim: (box: DealBoxItem) => void;
  isClaimed?: boolean;
}

export const DealBoxCard: React.FC<DealBoxCardProps> = ({
  box,
  onOpenDetails,
  onClaim,
  isClaimed = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClaimClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isClaimed || loading) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClaim(box);
    }, 500);
  };

  return (
    <div 
      id={`dealbox-card-${box.id}`}
      onClick={() => onOpenDetails(box)}
      className="bg-white rounded-2xl overflow-hidden shadow-xs flex flex-col border border-[#bccac0]/30 hover:border-[#006948]/50 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      {/* Top Card Image & Floating Badges */}
      <div className="relative w-full h-44 overflow-hidden bg-[#f2f3ff]">
        <img 
          src={box.imageUrl} 
          alt={box.title} 
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top-Right Tag (Remaining Boxes) */}
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 text-[#131b2e] text-[11px] font-semibold backdrop-blur-md shadow-2xs border border-white/60">
          {box.remainingText}
        </span>

        {/* Bottom-Right Tag (Distance & Walk Time) */}
        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-[#283044]/80 text-[#eef0ff] text-[11px] font-medium backdrop-blur-md">
          {box.distanceText}
        </span>
      </div>

      {/* Card Content Block */}
      <div className="p-4 flex flex-col gap-3">
        {/* Store Name & Pickup Window Row */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[#3d4a42] truncate max-w-[180px]">
            {box.storeName}
          </span>
          <span className="text-[12px] text-[#006948] font-medium flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-[16px]">
              schedule
            </span>
            <span>{box.pickupTimeText}</span>
          </span>
        </div>

        {/* Deal Box Headline */}
        <h3 className="text-[18px] font-bold text-[#131b2e] leading-snug">
          {box.title}
        </h3>

        {/* Primary Action Button (Claim Box) */}
        <button
          id={`claim-btn-${box.id}`}
          type="button"
          onClick={handleClaimClick}
          disabled={loading || (box.remainingCount <= 0 && !isClaimed)}
          className={`claim-btn w-full h-11 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${
            isClaimed
              ? 'bg-[#00855b] text-[#f5fff6] cursor-default'
              : 'bg-[#006948] text-white hover:bg-[#00855d] active:scale-[0.98] shadow-xs'
          }`}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
              <span>جارِ التأكيد...</span>
            </>
          ) : isClaimed ? (
            <>
              <span className="material-symbols-outlined text-[20px]">
                check
              </span>
              <span>تم حجز الاستلام!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">
                shopping_bag
              </span>
              <span>حجز الصندوق</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
