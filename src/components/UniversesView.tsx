import React, { useState, useMemo } from 'react';
import {
  Film,
  Compass,
  Play,
  Clock,
  Star,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import type { MediaItem, UniverseCollection, UniverseCategory } from '../types';
import { FRANCHISE_UNIVERSES, UNIVERSE_CATEGORIES } from '../data/universes';
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
  const [selectedCategory, setSelectedCategory] = useState<UniverseCategory | 'all'>('all');
  const [selectedUniverse, setSelectedUniverse] = useState<UniverseCollection>(FRANCHISE_UNIVERSES[0]);
  const [isChronological, setIsChronological] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Filtered universe collections by category
  const filteredUniverses = useMemo(() => {
    if (selectedCategory === 'all') return FRANCHISE_UNIVERSES;
    return FRANCHISE_UNIVERSES.filter(u => u.category === selectedCategory);
  }, [selectedCategory]);

  // Current active titles list (respecting chronological toggle)
  const currentItems = useMemo(() => {
    const base = isChronological && selectedUniverse.chronologicalItems
      ? selectedUniverse.chronologicalItems
      : selectedUniverse.items;

    if (!searchFilter.trim()) return base;
    const q = searchFilter.toLowerCase();
    return base.filter(
      item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.overview && item.overview.toLowerCase().includes(q)) ||
        (item.timelineLabel && item.timelineLabel.toLowerCase().includes(q))
    );
  }, [selectedUniverse, isChronological, searchFilter]);

  // Compute stats for current universe
  const stats = useMemo(() => {
    const items = selectedUniverse.items;
    const avgScore = items.length
      ? (items.reduce((acc, it) => acc + (it.vote_average || 0), 0) / items.length).toFixed(1)
      : '8.0';
    // Estimate roughly 2.2 hrs per movie, 8 hrs per TV show season
    const totalHours = items.reduce((acc, it) => {
      return acc + (it.media_type === 'tv' ? 8 : 2.3);
    }, 0);

    return {
      avgScore,
      totalHours: Math.round(totalHours),
      count: items.length,
    };
  }, [selectedUniverse]);

  const handleSelectUniverse = (uni: UniverseCollection) => {
    setSelectedUniverse(uni);
    setIsChronological(false);
    setSearchFilter('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1.5">
            <Compass className="w-4 h-4" />
            <span>Cinematic Universe Hubs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Legendary Sagas & Franchises
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Stream complete chronological storylines, visionary director filmographies, and mythical worlds in uncompressed 4K Ultra HD.
          </p>
        </div>

        {/* Search within Universe Filter */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder={`Search ${selectedUniverse.name}...`}
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 rounded-2xl border border-white/10 focus:border-indigo-500 focus:outline-none text-xs transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
        {UNIVERSE_CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              data-tv-focus="true"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Universes Carousel / Selector Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5 mb-10">
        {filteredUniverses.map(uni => {
          const isSelected = selectedUniverse.id === uni.id;
          return (
            <button
              key={uni.id}
              data-tv-focus="true"
              onClick={() => handleSelectUniverse(uni)}
              className={`group relative p-3.5 sm:p-4 rounded-2xl border text-left overflow-hidden transition-all duration-300 transform active:scale-95 ${
                isSelected
                  ? 'border-indigo-400 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20'
                  : 'border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10'
              }`}
              style={{
                background: isSelected
                  ? `linear-gradient(145deg, ${uni.accentColor}33 0%, rgba(14,16,26,0.95) 100%)`
                  : 'rgba(255,255,255,0.03)',
              }}
            >
              {/* Colored Indicator Dot */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-3 h-3 rounded-full shadow-md transition-transform group-hover:scale-125"
                  style={{ backgroundColor: uni.accentColor }}
                />
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                  {uni.items.length} titles
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                {uni.name}
              </h3>
              <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                {uni.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {/* Cinematic Showcase Hero Banner for Selected Universe */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 mb-10 shadow-2xl group">
        {/* Background Backdrop Artwork with Deep Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src={selectedUniverse.bannerUrl}
            alt={selectedUniverse.name}
            className="w-full h-full object-cover object-center filter brightness-40 scale-105 group-hover:scale-100 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/80 to-transparent" />
          <div
            className="absolute inset-0 opacity-25 -dodge"
            style={{ backgroundColor: selectedUniverse.accentColor }}
          />
        </div>

        {/* Hero Content Layer */}
        <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg text-white shadow-lg"
                style={{ backgroundColor: selectedUniverse.accentColor }}
              >
                4K UHD Franchise
              </span>

              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60  border border-white/10 text-amber-300 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{stats.avgScore} IMDb Avg</span>
              </span>

              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60  border border-white/10 text-gray-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>~{stats.totalHours}h Marathon</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {selectedUniverse.name}
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 font-semibold mt-1.5">
              "{selectedUniverse.tagline}"
            </p>
            {selectedUniverse.description && (
              <p className="text-xs sm:text-sm text-gray-300 mt-3 leading-relaxed max-w-xl">
                {selectedUniverse.description}
              </p>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {/* 1-Click Binge Playback */}
              <button
                data-tv-focus="true"
                onClick={() => {
                  if (currentItems.length > 0) {
                    onPlayMedia(currentItems[0]);
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-indigo-600/40 border border-indigo-400 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Binge Universe ({currentItems[0]?.title || currentItems[0]?.name || 'Start'})</span>
              </button>

              {/* Chronological vs Release Order Toggle (if available) */}
              {selectedUniverse.hasChronologicalOrder && (
                <button
                  data-tv-focus="true"
                  onClick={() => setIsChronological(prev => !prev)}
                  className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all  ${
                    isChronological
                      ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30 font-black'
                      : 'bg-black/60 hover:bg-black/80 text-gray-200 border-white/20'
                  }`}
                  title="Toggle Story Chronological Order vs Theatrical Release Order"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>{isChronological ? 'Order: Chronological Storyline' : 'Order: Theatrical Release'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Titles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <span>
              {selectedUniverse.name} Titles ({currentItems.length})
            </span>
          </h3>

          {selectedUniverse.hasChronologicalOrder && (
            <span className="text-xs font-bold text-indigo-300">
              Viewing in: <strong className="text-white">{isChronological ? 'Chronological Story Order' : 'Release Order'}</strong>
            </span>
          )}
        </div>

        {currentItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {currentItems.map((item, idx) => (
              <div key={`${item.media_type}-${item.id}`} className="relative group">
                {/* Timeline Tag Badge */}
                {item.timelineLabel && (
                  <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-black/85  border border-white/20 text-[10px] font-black text-indigo-300 shadow-lg">
                    #{idx + 1} • {item.timelineLabel}
                  </div>
                )}
                <MediaCard
                  item={item}
                  onSelect={onSelectMedia}
                  onPlay={onPlayMedia}
                  isInWatchlist={isInWatchlist(item.id)}
                  onToggleWatchlist={onToggleWatchlist}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white/5 rounded-3xl border border-white/10 p-8">
            <p className="text-base font-bold text-white">No titles match "{searchFilter}"</p>
            <p className="text-xs text-gray-400 mt-1">Try another keyword or clear the search filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
