import React, { useState } from 'react';
import { DEALBOX_LOGO_URL } from '../data/mockBaskets';

interface DealBoxHeaderProps {
  currentLocation: string;
  onOpenLocationModal: () => void;
  onOpenNotifications: () => void;
  unreadNotifications: boolean;
  projectLogo?: string | null;
}

export const DealBoxHeader: React.FC<DealBoxHeaderProps> = ({
  currentLocation,
  onOpenLocationModal,
  onOpenNotifications,
  unreadNotifications,
  projectLogo,
}) => {
  return (
    <header className="sticky top-0 w-full z-30 bg-[#faf8ff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eaedff]/60">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-2">
        {/* Logo and Brand Name */}
        <div className="flex items-center gap-2 select-none">
          <img 
            src={projectLogo || DEALBOX_LOGO_URL} 
            alt="DealBox Logo" 
            className="h-8 w-8 object-contain rounded-lg"
          />
          <span className="text-[20px] font-bold text-[#131b2e] tracking-tight">
            DealBox
          </span>
        </div>

        {/* Location & Notifications Actions */}
        <div className="flex items-center gap-2">
          {/* Location selector pill */}
          <button 
            id="location-pill-btn"
            onClick={onOpenLocationModal}
            className="h-9 px-3 flex items-center gap-1.5 rounded-full bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-all text-xs font-medium border border-transparent hover:border-[#bccac0]/30"
          >
            <span className="material-symbols-outlined text-[#006948] text-[18px]">
              location_on
            </span>
            <span className="text-[12px] font-medium truncate max-w-[130px]">
              {currentLocation}
            </span>
          </button>

          {/* Notifications button */}
          <button 
            id="notifications-btn"
            onClick={onOpenNotifications}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-all relative border border-transparent hover:border-[#bccac0]/30"
            aria-label="التنبيهات"
          >
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
            {unreadNotifications && (
              <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-[#006948] ring-2 ring-[#faf8ff] animate-pulse"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
