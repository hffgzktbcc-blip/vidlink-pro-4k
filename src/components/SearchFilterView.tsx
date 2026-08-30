import React, { useState, useMemo } from 'react';
import { Search, Film, Tv } from 'lucide-react';
import type { MediaItem } from '../types';
import { GENRES } from '../data/mockCatalog';
import { MediaCard } from './MediaCard';

interface SearchFilterViewProps {
  searchQuery: string;
  items: MediaItem[];
  isLoading: boolean;
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
  isInWatchlist: (id: number) => boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const SearchFilterView: React.FC<SearchFilterViewProps> = ({
  searchQuery,
  items,
  isLoading,
  onSelectMedia,
  onPlayMedia,
  isInWatchlist,
  onToggleWatchlist,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'newest'>('popularity');

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Type filter
        if (selectedType !== 'all') {
          const itemType = item.media_type || (item.title ? 'movie' : 'tv');
          if (itemType !== selectedType) return false;
        }

        // Genre filter
        if (selectedGenre !== null) {
          const hasGenre =
            item.genre_ids?.includes(selectedGenre) ||
            item.genres?.some(g => g.id === selectedGenre);
          if (!hasGenre) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.vote_average || 0) - (a.vote_average || 0);
        }
        if (sortBy === 'newest') {
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          return dateB.localeCompare(dateA);
        }
        return (b.vote_count || 0) - (a.vote_count || 0);
      });
  }, [items, selectedType, selectedGenre, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28">
      {/* Header with Title & Stats */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-400" />
            <span>
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Browse 4K Catalog'}
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Found {filteredItems.length} titles available in 4K Ultra HD
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#141624] border border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated (TMDB)</option>
            <option value="newest">Newest Releases</option>
          </select>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl mb-8 space-y-4">
        {/* Type Switcher Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedType === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setSelectedType('movie')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              selectedType === 'movie'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies Only</span>
          </button>
          <button
            onClick={() => setSelectedType('tv')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              selectedType === 'tv'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Series Only</span>
          </button>
        </div>

        {/* Genres Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGenre === null
                ? 'bg-white/20 text-white font-bold'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === g.id
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Media Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-2xl skeleton-shimmer border border-white/5"
            />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredItems.map(item => (
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
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 p-8">
          <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No matching titles found</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            Try adjusting your search query, selecting different genres, or resetting your filter options.
          </p>
          <button
            onClick={() => {
              setSelectedGenre(null);
              setSelectedType('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
