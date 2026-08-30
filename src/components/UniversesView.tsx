import React, { useState } from 'react';
import { Film, Compass } from 'lucide-react';
import type { MediaItem, UniverseCollection } from '../types';
import { FRANCHISE_UNIVERSES } from '../data/universes';
import { MediaCard } from './MediaCard';

interface UniversesViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
  isInWatchlist: (id: number) => boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const UniversesView: React.FC<UniversesViewProps> = ({
  onSelectMedia,
  onPlayMedia,
  isInWatchlist,
  onToggleWatchlist,
}) => {
  const [selectedUniverse, setSelectedUniverse] = useState<UniverseCollection>(FRANCHISE_UNIVERSES[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28">
      {/* Universes Selector Tabs */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mb-2">
          <Compass className="w-6 h-6 text-indigo-400" />
          <span>Cinematic Universe Hubs</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-6">
          Explore complete franchises, director collections, and legendary cinematic sagas in 4K Ultra HD.
        </p>

        {/* Universe Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {FRANCHISE_UNIVERSES.map(uni => {
            const isSelected = selectedUniverse.id === uni.id;
            return (
              <button
                key={uni.id}
                onClick={() => setSelectedUniverse(uni)}
                className={`relative p-4 rounded-2xl border text-left overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${
                  isSelected
                    ? 'border-indigo-400 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${uni.accentColor}33 0%, rgba(14,16,26,0.9) 100%)`
                    : 'rgba(255,255,255,0.03)',
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mb-2 shadow"
                  style={{ backgroundColor: uni.accentColor }}
                />
                <h3 className="text-sm font-bold text-white truncate">{uni.name}</h3>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{uni.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Universe Showcase Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl mb-8 relative overflow-hidden border border-white/15">
        <div className="relative z-10 max-w-xl">
          <span
            className="px-3 py-1 text-xs font-black uppercase rounded-lg text-white mb-3 inline-block shadow"
            style={{ backgroundColor: selectedUniverse.accentColor }}
          >
            4K Franchise Hub
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {selectedUniverse.name}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
            {selectedUniverse.tagline}
          </p>
        </div>

        {/* Backdrop overlay decoration */}
        <div
          className="absolute -top-12 -right-12 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: selectedUniverse.accentColor }}
        />
      </div>

      {/* Movies / Shows in this Universe */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <span>Titles in {selectedUniverse.name} ({selectedUniverse.items.length})</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {selectedUniverse.items.map(item => (
            <MediaCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              size="normal"
              onSelect={onSelectMedia}
              onPlay={onPlayMedia}
              isInWatchlist={isInWatchlist(item.id)}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
