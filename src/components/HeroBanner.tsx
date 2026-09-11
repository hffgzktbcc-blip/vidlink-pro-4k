import React, { useState, useEffect } from 'react';
import {
  Play,
  Info,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Video,
} from 'lucide-react';
import type { MediaItem } from '../types';
import { getBackdropUrl } from '../services/tmdb';
import { playSelectSound } from '../services/soundEffects';

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

interface HeroBannerProps {
  items: MediaItem[];
  railItems?: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
  onOpenTrailer?: (item: MediaItem) => void;
  isInWatchlist: (id: number) => boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  items,
  railItems,
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
    }, 8500);
    return () => clearInterval(interval);
  }, [items, isPaused]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex] || items[0];
  const title = current.title || current.name || 'Featured Title';
  const year = (current.release_date || current.first_air_date || '').split('-')[0];
  const isMovie = current.media_type === 'movie' || (!current.media_type && !!current.title);
  const saved = isInWatchlist(current.id);

  // Genre determination
  const genreName =
    current.genres?.[0]?.name ||
    (current.genre_ids?.[0] ? GENRE_MAP[current.genre_ids[0]] : null) ||
    (isMovie ? 'Action & Sci-Fi' : 'Sci-Fi');

  const prevSlide = () => {
    setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  // Rail of 16:9 cards matching the "New Episodes" in the reference image
  const displayRail = (railItems && railItems.length > 0 ? railItems : items).slice(0, 7);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-[640px] md:min-h-[720px] lg:min-h-[800px] overflow-hidden bg-[#07080d] flex flex-col justify-end"
    >
      {/* Cinematic Background Backdrop Image with Crossfade */}
      <div className="absolute inset-0 z-0">
        <img
          key={current.id}
          src={getBackdropUrl(current.backdrop_path, 'original')}
          alt={title}
          className="w-full h-full object-cover object-top opacity-70 transition-all duration-1000 scale-100"
        />

        {/* Multi-layered cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080d] via-[#07080d]/80 to-transparent w-full md:w-4/5" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#07080d]/20 to-[#07080d]/80" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-24 flex flex-col justify-end">
        <div className="max-w-2xl">
          {/* Spaced Cinematic Title matching Reference Mockup */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.22em] text-white uppercase drop-shadow-2xl leading-none">
            {title}
          </h1>

          {/* Clean Genre & Tagline Row */}
          <div className="flex items-center gap-2 mt-4 text-xs sm:text-sm font-semibold tracking-wider text-gray-300">
            <span className="text-white/90">{genreName}</span>
            <span className="text-white/40">•</span>
            <span>{year || '2024'}</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-400 font-bold">4K HDR</span>
            {current.vote_average > 0 && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-emerald-400 font-bold">
                  {Math.min(99, Math.round(current.vote_average * 10 + 12))}% Match
                </span>
              </>
            )}
          </div>

          {/* Synopsis Paragraph */}
          <p className="mt-3 text-xs sm:text-sm md:text-base text-gray-300/90 line-clamp-3 leading-relaxed drop-shadow max-w-xl font-normal">
            {current.overview}
          </p>

          {/* Clean Pill Call to Action Buttons matching "Watch" Pill in mockup */}
          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            {/* White Pill Watch Button */}
            <button
              data-tv-focus="true"
              onClick={() => {
                playSelectSound();
                onPlayMedia(current);
              }}
              className="px-8 py-3 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-2xl transform hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Watch</span>
            </button>

            {/* Translucent Pill More Info */}
            <button
              data-tv-focus="true"
              onClick={() => {
                playSelectSound();
                onSelectMedia(current);
              }}
              className="px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white font-bold text-sm sm:text-base flex items-center gap-2 transition-all"
            >
              <Info className="w-4 h-4" />
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
                className="px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white font-bold text-sm flex items-center gap-2 transition-all"
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
              className={`p-3 rounded-full border transition-all ${
                saved
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/40'
                  : 'bg-black/50 hover:bg-black/70 text-white border-white/30 hover:border-white/60'
              }`}
            >
              {saved ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* "New Episodes" / Featured 16:9 Landscape Rail directly inside Hero (Matching Reference Image) */}
        <div className="mt-8 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/90 flex items-center gap-2">
              <span>New Episodes</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-1.5 rounded-full bg-black/40 hover:bg-white/20 border border-white/10 text-white transition-all"
                aria-label="Previous featured"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-1.5 rounded-full bg-black/40 hover:bg-white/20 border border-white/10 text-white transition-all"
                aria-label="Next featured"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 pt-1">
            {displayRail.map((item, idx) => {
              const isSelected = item.id === current.id;
              const thumbTitle = item.title || item.name || '';
              return (
                <button
                  key={item.id}
                  data-tv-focus="true"
                  onClick={() => {
                    playSelectSound();
                    setCurrentIndex(idx);
                  }}
                  className={`group/rail relative aspect-video w-36 sm:w-48 md:w-56 shrink-0 rounded-xl overflow-hidden border transition-all duration-300 text-left cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'border-white ring-2 ring-white/90 scale-105 shadow-2xl shadow-black/80'
                      : 'border-white/15 opacity-70 hover:opacity-100 hover:border-white/40'
                  }`}
                >
                  <img
                    src={getBackdropUrl(item.backdrop_path, 'w780')}
                    alt={thumbTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/rail:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-2.5">
                    <span className="text-[11px] sm:text-xs font-bold text-white line-clamp-1 drop-shadow-md">
                      {thumbTitle}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white text-black shadow">
                      Spotlight
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
