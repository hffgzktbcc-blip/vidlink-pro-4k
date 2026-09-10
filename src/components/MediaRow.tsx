import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { TopTenBadge } from './TopTenBadge';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  icon?: LucideIcon;
  badge?: string;
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
  isInWatchlist?: (id: number) => boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  cardSize?: 'normal' | 'large' | 'compact';
  isTopTen?: boolean;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  icon: Icon,
  badge,
  onSelectMedia,
  onPlayMedia,
  isInWatchlist,
  onToggleWatchlist,
  cardSize = 'normal',
  isTopTen = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!items || items.length === 0) return null;

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative py-4 sm:py-6 group/row">
      {/* Row Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-red-600/15 text-red-500 border border-red-500/30">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {title}
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-gradient-to-r from-red-600 to-rose-600 text-white">
                {badge}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Scroll Chevron */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/80 hover:bg-red-600 border border-white/20 text-white flex items-center justify-center shadow-2xl backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover/row:translate-x-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Right Scroll Chevron */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/80 hover:bg-red-600 border border-white/20 text-white flex items-center justify-center shadow-2xl backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-300 transform translate-x-2 group-hover/row:translate-x-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Items List Row */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
        >
          {items.map((item, index) => (
            <div key={`${item.media_type}-${item.id}`} className="flex items-center shrink-0">
              {isTopTen && <TopTenBadge rank={index + 1} />}
              <MediaCard
                item={item}
                size={cardSize}
                onSelect={onSelectMedia}
                onPlay={onPlayMedia}
                isInWatchlist={isInWatchlist ? isInWatchlist(item.id) : false}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
