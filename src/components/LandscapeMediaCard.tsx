import React, { useState } from 'react';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import type { MediaItem } from '../types';
import { getBackdropUrl, getImageUrl } from '../services/tmdb';
import { playSelectSound } from '../services/soundEffects';

interface LandscapeMediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  progressPercent?: number;
  episodeLabel?: string;
  size?: 'normal' | 'large' | 'compact';
  subtitle?: string;
}

export const LandscapeMediaCard: React.FC<LandscapeMediaCardProps> = ({
  item,
  onSelect,
  onPlay,
  isInWatchlist = false,
  onToggleWatchlist,
  progressPercent,
  episodeLabel,
  size = 'normal',
  subtitle,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const title = item.title || item.name || 'Untitled';
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const matchPercent = item.vote_average ? Math.min(99, Math.round(item.vote_average * 10 + 12)) : 96;
  const isMovie = item.media_type === 'movie' || (!item.media_type && !!item.title);

  // Widths calibrated for 16:9 aspect-video
  const sizeClasses = {
    compact: 'w-48 sm:w-56 shrink-0',
    normal: 'w-56 sm:w-64 md:w-72 shrink-0',
    large: 'w-64 sm:w-80 md:w-96 shrink-0',
  }[size];

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      playSelectSound();
      onSelect(item);
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      playSelectSound();
      onPlay(item);
    } else if (e.key.toLowerCase() === 'w' && onToggleWatchlist) {
      e.preventDefault();
      playSelectSound();
      onToggleWatchlist(item);
    }
  };

  const imageSrc = item.backdrop_path
    ? getBackdropUrl(item.backdrop_path, size === 'large' ? 'original' : 'w780')
    : getImageUrl(item.poster_path, 'w500');

  return (
    <div
      tabIndex={0}
      data-tv-focus="true"
      onKeyDown={handleCardKeyDown}
      className={`group relative rounded-2xl cursor-pointer select-none card-hover-effect tv-card-container focus:outline-none ${sizeClasses}`}
    >
      {/* 16:9 Thumbnail Box */}
      <div
        onClick={() => onSelect(item)}
        className="relative aspect-video w-full bg-[#10121d] rounded-2xl overflow-hidden border border-white/10 group-hover:border-indigo-500/70 group-focus:border-indigo-500 shadow-xl transition-all duration-300"
      >
        {/* Loading shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton-shimmer z-0" />
        )}

        <img
          src={imageSrc}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-md bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/40 shadow-md">
            4K UHD
          </span>

          {rating && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </span>
          )}
        </div>

        {/* Progress Bar for Continue Watching */}
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 overflow-hidden z-20">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(6, progressPercent))}%` }}
            />
          </div>
        )}

        {/* Hover / Focus Overlay with Play button */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d]/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-20">
          <button
            onClick={e => {
              e.stopPropagation();
              playSelectSound();
              onPlay(item);
            }}
            title="Play Now"
            className="p-3.5 rounded-full bg-white text-black hover:bg-white/90 shadow-2xl transform hover:scale-110 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </button>

          {onToggleWatchlist && (
            <button
              onClick={e => {
                e.stopPropagation();
                playSelectSound();
                onToggleWatchlist(item);
              }}
              title={isInWatchlist ? 'Remove from List' : 'Add to List'}
              className={`p-3 rounded-full backdrop-blur-md border transform hover:scale-110 active:scale-95 transition-all ${
                isInWatchlist
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
              }`}
            >
              {isInWatchlist ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              playSelectSound();
              onSelect(item);
            }}
            title="Details & Episodes"
            className="p-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transform hover:scale-110 active:scale-95 transition-all"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clean labels below thumbnail matching reference mockup */}
      <div className="mt-2 px-0.5" onClick={() => onSelect(item)}>
        <h4 className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-white truncate transition-colors">
          {title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-0.5 font-medium">
          <span className="truncate">
            {subtitle || episodeLabel || (isMovie ? `${year || '2024'} • Movie` : `${year || '2024'} • TV Series`)}
          </span>
          <span className="text-emerald-400 font-bold shrink-0 text-[10px]">
            {matchPercent}% Match
          </span>
        </div>
      </div>
    </div>
  );
};
