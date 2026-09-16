import React, { useState, useEffect } from 'react';
import {
  X,
  Dices,
  Play,
  Star,
  Info,
} from 'lucide-react';
import type { MediaItem } from '../types';
import { getBackdropUrl } from '../services/tmdb';
import { playSelectSound, playTaDum } from '../services/soundEffects';

interface SurpriseMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlay: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
  items?: MediaItem[];
}

const ROULETTE_VIBES = [
  { id: 'all', name: '🎲 Any Genre' },
  { id: 'action', name: '💥 Action', genreId: 28 },
  { id: 'scifi', name: '🚀 Sci-Fi', genreId: 878 },
  { id: 'comedy', name: '😂 Comedy', genreId: 35 },
  { id: 'horror', name: '😱 Horror', genreId: 27 },
  { id: 'top', name: '⭐ IMDb 8.0+' },
];

export const SurpriseMeModal: React.FC<SurpriseMeModalProps> = ({
  isOpen,
  onClose,
  onPlay,
  onSelectMedia,
  items = [],
}) => {
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [pickedItem, setPickedItem] = useState<MediaItem | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Filter candidate items based on chosen vibe
  const getFilteredItems = (vibeId: string) => {
    if (!items || items.length === 0) return [];
    if (vibeId === 'top') {
      return items.filter(i => (i.vote_average || 0) >= 7.8);
    }
    const vibe = ROULETTE_VIBES.find(v => v.id === vibeId);
    if (vibe && vibe.genreId) {
      return items.filter(i => i.genre_ids?.includes(vibe.genreId!));
    }
    return items;
  };

  const rollMovie = () => {
    const pool = getFilteredItems(selectedVibe);
    if (pool.length === 0) {
      if (items.length > 0) setPickedItem(items[Math.floor(Math.random() * items.length)]);
      return;
    }

    setIsRolling(true);
    playSelectSound();

    let counter = 0;
    const interval = setInterval(() => {
      const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
      setPickedItem(randomCandidate);
      counter++;
      if (counter >= 12) {
        clearInterval(interval);
        setIsRolling(false);
        playTaDum();
      }
    }, 90);
  };

  useEffect(() => {
    if (isOpen) {
      rollMovie();
    }
  }, [isOpen, selectedVibe]);

  if (!isOpen) return null;

  const current = pickedItem || items[0];
  const title = current?.title || current?.name || 'Surprise Selection';
  const year = (current?.release_date || current?.first_air_date || '').split('-')[0];
  const rating = current?.vote_average ? current.vote_average.toFixed(1) : '8.5';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl bg-[#0b0d17] border border-white/20 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.25)] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-white/20 text-white border border-white/15 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Visual Header */}
        <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-black">
          {current && (
            <img
              key={current.id}
              src={getBackdropUrl(current.backdrop_path, 'w780')}
              alt={title}
              className={`w-full h-full object-cover object-top transition-all duration-500 ${
                isRolling ? 'scale-110 blur-sm opacity-50' : 'scale-100 opacity-80'
              }`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d17] via-[#0b0d17]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d17]/80 to-transparent" />

          {/* Badge & Rating */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
              <Dices className="w-3.5 h-3.5" />
              Cinema Roulette
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {rating}
            </span>
          </div>

          {/* Title & Metadata overlaid at bottom of backdrop */}
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-2xl">
              {title}
            </h2>
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-gray-300 mt-1">
              <span>{year || '2024'}</span>
              <span>•</span>
              <span className="text-indigo-400 uppercase">{current?.media_type === 'tv' ? 'TV Series' : 'Movie'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">4K Ultra HD</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Vibe Selector Pills */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Filter by Vibe:
            </span>
            <div className="flex flex-wrap gap-2">
              {ROULETTE_VIBES.map(vibe => (
                <button
                  key={vibe.id}
                  onClick={() => {
                    playSelectSound();
                    setSelectedVibe(vibe.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedVibe === vibe.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-indigo-400 scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  {vibe.name}
                </button>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3">
            {current?.overview || 'Ready to stream immediately in crisp 4K Ultra HD with spatial surround sound.'}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                if (!current) return;
                onPlay(current);
                onClose();
              }}
              disabled={isRolling}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-white hover:bg-white/90 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Stream Now in 4K</span>
            </button>

            <button
              onClick={rollMovie}
              disabled={isRolling}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Dices className={`w-4 h-4 text-indigo-400 ${isRolling ? 'animate-spin' : ''}`} />
              <span>Roll Again</span>
            </button>

            <button
              onClick={() => {
                if (!current) return;
                onSelectMedia(current);
                onClose();
              }}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Info className="w-4 h-4" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
