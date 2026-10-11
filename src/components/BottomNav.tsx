import React from 'react';
import { ActiveNavTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  reservationsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  reservationsCount,
}) => {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#faf8ff]/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] border-t border-[#eaedff]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {/* Tab 1: الرئيسية */}
        <button
          id="nav-tab-explore"
          onClick={() => onChangeTab('explore-home')}
          className={`flex flex-col items-center justify-center min-w-[64px] h-12 transition-colors relative ${
            activeTab === 'explore-home'
              ? 'text-[#006948] font-semibold'
              : 'text-[#3d4a42] hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            storefront
          </span>
          <span className="text-[11px] mt-0.5">الرئيسية</span>
        </button>

        {/* Tab 2: حجوزاتي */}
        <button
          id="nav-tab-reservations"
          onClick={() => onChangeTab('my-reservations')}
          className={`flex flex-col items-center justify-center min-w-[64px] h-12 transition-colors relative ${
            activeTab === 'my-reservations'
              ? 'text-[#006948] font-semibold'
              : 'text-[#3d4a42] hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            shopping_bag
          </span>
          <span className="text-[11px] mt-0.5">حجوزاتي</span>
          {reservationsCount > 0 && (
            <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-[#006948] text-white text-[10px] font-bold flex items-center justify-center">
              {reservationsCount}
            </span>
          )}
        </button>

        {/* Tab 3: الخريطة */}
        <button
          id="nav-tab-map"
          onClick={() => onChangeTab('stores-map')}
          className={`flex flex-col items-center justify-center min-w-[64px] h-12 transition-colors relative ${
            activeTab === 'stores-map'
              ? 'text-[#006948] font-semibold'
              : 'text-[#3d4a42] hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            map
          </span>
          <span className="text-[11px] mt-0.5">الخريطة</span>
        </button>

        {/* Tab 4: حسابي */}
        <button
          id="nav-tab-profile"
          onClick={() => onChangeTab('user-profile')}
          className={`flex flex-col items-center justify-center min-w-[64px] h-12 transition-colors relative ${
            activeTab === 'user-profile'
              ? 'text-[#006948] font-semibold'
              : 'text-[#3d4a42] hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            account_circle
          </span>
          <span className="text-[11px] mt-0.5">حسابي</span>
        </button>
      </div>
    </nav>
  );
};
