import React from 'react';
import { Flame, Film, Tv, Sparkles, Bookmark } from 'lucide-react';
import type { ActiveTab } from '../types';
import { triggerHaptic } from '../services/haptics';
import { playSelectSound } from '../services/soundEffects';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  watchlistCount: number;
  onClearSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  watchlistCount,
  onClearSearch,
}) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Flame },
    { id: 'movies' as ActiveTab, label: 'Movies', icon: Film },
    { id: 'tv' as ActiveTab, label: 'TV Shows', icon: Tv },
    { id: '4k' as ActiveTab, label: '4K UHD', icon: Sparkles },
    { id: 'watchlist' as ActiveTab, label: 'My List', icon: Bookmark, count: watchlistCount },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#07080e]/92 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-[max(0.75rem,env(safe-area-inset-bottom,12px))] pt-2 px-3 transition-transform duration-300"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                playSelectSound();
                setActiveTab(tab.id);
                if (onClearSearch) onClearSearch();
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 select-none ${
                isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <span className="absolute -top-1.5 w-8 h-1 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-indigo-500 shadow-lg shadow-red-600/50 animate-pulse" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-white stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 min-w-[16px] text-[9px] font-black rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                    {tab.count}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 font-semibold tracking-tight transition-colors ${
                isActive ? 'text-white font-bold' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
