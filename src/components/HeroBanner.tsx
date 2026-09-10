import React, { useState, useEffect } from 'react';
import {
  Play,
  Info,
  Plus,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  Video,
  Flame,
} from 'lucide-react';
import type { MediaItem } from '../types';
import { getBackdropUrl, getImageUrl } from '../services/tmdb';
import { playSelectSound } from '../services/soundEffects';

interface HeroBannerProps {
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
  onOpenTrailer?: (item: MediaItem) => void;
  isInWatchlist: (id: number) => boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  items,
  onSelectMedia,
  onPlayMedia,
  onOpenTrailer,
  isInWatchlist,
  onToggleWatchlist,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 7500);
    return () => clearInterval(interval);
  }, [items, isPaused]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex] || items[0];
  const title = current.title || current.name || 'Featured Title';
  const year = (current.release_date || current.first_air_date || '').split('-')[0];
  const isMovie = current.media_type === 'movie' || (!current.media_type && !!current.title);
  const saved = isInWatchlist(current.id);
  const matchPercent = current.vote_average ? Math.min(99, Math.round(current.vote_average * 10 + 12)) : 97;

  const prevSlide = () => {
    setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[80vh] min-h-[600px] max-h-[850px] overflow-hidden bg-[#07080d]"
    >
      {/* Background Backdrop Image with Crossfade */}
      <div className="absolute inset-0 z-0">
        <img
          key={current.id}
          src={getBackdropUrl(current.backdrop_path, 'original')}
          alt={title}
          className="w-full h-full object-cover object-top opacity-60 transition-all duration-1000 scale-100 animate-in fade-in"
        />

        {/* Multi-layered cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080d] via-[#07080d]/85 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#07080d]/20 to-[#07080d]/80" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 pt-24">
        <div className="max-w-2xl">
          {/* Quality & Type Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black tracking-wider uppercase rounded-md bg-[#E50914] text-white shadow-lg shadow-red-600/40">
              <Flame className="w-3.5 h-3.5 fill-white" />
              #1 IN MOVIES TODAY
            </span>
            <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/40">
              4K ULTRA HD
            </span>
            <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-black/70 backdrop-blur-md text-white/90 border border-white/20">
              DOLBY VISION
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md bg-white/10 backdrop-blur-md text-gray-300">
              {isMovie ? 'FEATURE FILM' : 'TV SERIES'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
            {title}
          </h1>

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-300 font-medium">
            <span className="text-[#46d369] font-black tracking-wide">
              {matchPercent}% Match
            </span>
            {current.vote_average > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold">{current.vote_average.toFixed(1)}</span>
              </div>
            )}
            {year && <span>{year}</span>}
            {current.runtime && (
              <>
                <span>•</span>
                <span>{Math.floor(current.runtime / 60)}h {current.runtime % 60}m</span>
              </>
            )}
            {current.number_of_seasons && (
              <>
                <span>•</span>
                <span>{current.number_of_seasons} Seasons</span>
              </>
            )}
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-white/40 text-gray-300">
              16+
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-white/40 text-gray-300">
              HD / 4K
            </span>
          </div>

          {/* Tagline or Overview */}
          {current.tagline && (
            <p className="mt-2.5 text-gray-300 text-sm font-semibold italic">
              "{current.tagline}"
            </p>
          )}

          <p className="mt-3 text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow">
            {current.overview}
          </p>

          {/* Netflix Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            {/* Main Netflix Play Button (White with Black Text) */}
            <button
              data-tv-focus="true"
              onClick={() => {
                playSelectSound();
                onPlayMedia(current);
              }}
              className="px-8 py-3.5 rounded-md bg-white hover:bg-white/90 text-black font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-2xl transform hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Play</span>
            </button>

            {/* Netflix More Info Button (Translucent dark) */}
            <button
              data-tv-focus="true"
              onClick={() => {
                playSelectSound();
                onSelectMedia(current);
              }}
              className="px-6 py-3.5 rounded-md bg-white/25 hover:bg-white/35 backdrop-blur-xl text-white font-bold text-sm sm:text-base flex items-center gap-2 transition-all"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </button>

            {/* Trailer button */}
            {onOpenTrailer && (
              <button
                data-tv-focus="true"
                onClick={() => {
                  playSelectSound();
                  onOpenTrailer(current);
                }}
                className="px-5 py-3.5 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white font-bold text-sm flex items-center gap-2 transition-all"
                title="Watch 4K Trailer"
              >
                <Video className="w-4 h-4 text-red-500" />
                <span>Trailer</span>
              </button>
            )}

            {/* Watchlist Toggle Button */}
            <button
              data-tv-focus="true"
              onClick={() => {
                playSelectSound();
                onToggleWatchlist(current);
              }}
              title={saved ? 'Remove from My List' : 'Add to My List'}
              className={`p-3.5 rounded-full border transition-all ${
                saved
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/40'
                  : 'bg-black/50 hover:bg-black/70 text-white border-white/30 hover:border-white/60'
              }`}
            >
              {saved ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Carousel Mini Navigation & Slide Thumbnails */}
        <div className="hidden lg:flex items-center justify-between mt-8 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Featured 4K Picks:
            </span>
            <div className="flex items-center gap-2">
              {items.slice(0, 5).map((item, idx) => {
                const isActive = idx === currentIndex;
                const thumbTitle = item.title || item.name || '';
                return (
                  <button
                    key={item.id}
                    data-tv-focus="true"
                    onClick={() => setCurrentIndex(idx)}
                    className={`group/thumb relative rounded-xl overflow-hidden transition-all duration-300 ${
                      isActive
                        ? 'ring-2 ring-indigo-500 scale-105 shadow-xl shadow-indigo-500/30'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getImageUrl(item.poster_path, 'w300')}
                      alt={thumbTitle}
                      className="w-16 h-10 object-cover"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-indigo-600/25" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev/Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all"
              aria-label="Previous featured"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-gray-400 px-1">
              {currentIndex + 1} / {items.length}
            </span>
            <button
              onClick={nextSlide}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all"
              aria-label="Next featured"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
