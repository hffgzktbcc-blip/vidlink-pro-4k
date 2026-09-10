import React, { useState } from 'react';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import type { MediaItem } from '../types';
import { getImageUrl } from '../services/tmdb';
import { playSelectSound } from '../services/soundEffects';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  size?: 'normal' | 'large' | 'compact';
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onSelect,
  onPlay,
  isInWatchlist = false,
  onToggleWatchlist,
  size = 'normal',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const title = item.title || item.name || 'Untitled';
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const matchPercent = item.vote_average ? Math.min(99, Math.round(item.vote_average * 10 + 12)) : 95;
  const isMovie = item.media_type === 'movie' || (!item.media_type && !!item.title);

  const sizeClasses = {
    compact: 'w-36 sm:w-44 shrink-0',
    normal: 'w-40 sm:w-48 md:w-56 shrink-0',
    large: 'w-48 sm:w-60 md:w-72 shrink-0',
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

  return (
    <div
      tabIndex={0}
      data-tv-focus="true"
      onKeyDown={handleCardKeyDown}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer select-none card-hover-effect tv-card-container focus:outline-none ${sizeClasses}`}
    >
      {/* Poster Image Container */}
      <div
        onClick={() => onSelect(item)}
        className="relative aspect-[2/3] w-full bg-[#10121d] rounded-2xl overflow-hidden border border-white/10 group-hover:border-indigo-500/60 group-focus:border-indigo-500/80 shadow-xl transition-all duration-300"
      >
        {/* Loading shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton-shimmer z-0" />
        )}

        <img
          src={getImageUrl(item.poster_path, size === 'large' ? 'w780' : 'w500')}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-108 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Quality Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-md bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/40 shadow-md">
            4K HDR
          </span>

          {rating && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </span>
          )}
        </div>

        {/* Match Percentage Badge bottom left */}
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-10">
          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
            {matchPercent}% Match
          </span>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-black/60 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 tv-card-overlay transition-all duration-300 flex flex-col justify-end p-4 z-20">
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2.5 mb-3">
            {/* Direct Play Stream Button */}
            <button
              onClick={e => {
                e.stopPropagation();
                onPlay(item);
              }}
              title="Stream in 4K UHD"
              className="p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/50 transform hover:scale-115 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </button>

            {/* Quick Watchlist Toggle */}
            {onToggleWatchlist && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onToggleWatchlist(item);
                }}
                title={isInWatchlist ? 'Remove from List' : 'Add to List'}
                className={`p-3 rounded-full backdrop-blur-md border transform hover:scale-115 active:scale-95 transition-all ${
                  isInWatchlist
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-white/20 hover:bg-white/30 text-white border-white/20'
                }`}
              >
                {isInWatchlist ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
              </button>
            )}

            {/* Quick Info Details Button */}
            <button
              onClick={e => {
                e.stopPropagation();
                onSelect(item);
              }}
              title="View Storyline & Cast"
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transform hover:scale-115 active:scale-95 transition-all"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 text-center">
            {title}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-gray-300 font-medium">
            {year && <span>{year}</span>}
            <span>•</span>
            <span className="text-indigo-300 uppercase">{isMovie ? 'Film' : 'Series'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">Free Stream</span>
          </div>
        </div>
      </div>

      {/* Subtitle Card Details */}
      <div className="mt-2.5 px-1" onClick={() => onSelect(item)}>
        <h4 className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-indigo-400 truncate transition-colors">
          {title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-0.5">
          <span>{year || '2024'}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-300">
            {isMovie ? 'Movie' : 'TV'}
          </span>
        </div>
      </div>
    </div>
  );
};
