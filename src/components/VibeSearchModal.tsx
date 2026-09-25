import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Search,
  Film,
  Play,
  Star,
  Zap,
} from 'lucide-react';
import type { MediaItem } from '../types';
import { FRANCHISE_UNIVERSES } from '../data/universes';
import { playSelectSound } from '../services/soundEffects';

interface VibeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
  catalogItems: MediaItem[];
}

interface VibePreset {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
  keywords: string[];
  genreHints: number[];
}

const VIBE_PRESETS: VibePreset[] = [
  {
    id: 'cyberpunk',
    emoji: '🌧️',
    label: 'Neon Cyberpunk Thriller',
    prompt: 'Rainy neon-lit Tokyo cyberpunk thriller with synthwave music',
    keywords: ['cyber', 'blade', 'matrix', 'future', 'dystopia', 'neon', 'city', 'synth'],
    genreHints: [878, 53, 28],
  },
  {
    id: 'mindbending',
    emoji: '🌀',
    label: 'Reality-Bending Sci-Fi',
    prompt: 'Mind-bending sci-fi where nothing is what it seems',
    keywords: ['inception', 'dream', 'interstellar', 'time', 'tenet', 'dimension', 'space', 'memory'],
    genreHints: [878, 9648],
  },
  {
    id: 'comfort',
    emoji: '🍕',
    label: 'Sunday Comfort & Pizza',
    prompt: 'Comforting comedy or adventure to watch while eating pizza',
    keywords: ['comfort', 'friends', 'laugh', 'adventure', 'fun', 'hero', 'travel'],
    genreHints: [35, 12, 10751],
  },
  {
    id: 'mystery',
    emoji: '🔪',
    label: 'Dark Twist Murder Mystery',
    prompt: 'Dark murder mystery with sharp wit and unexpected plot twists',
    keywords: ['batman', 'detective', 'murder', 'killer', 'secret', 'investigate', 'twist', 'dark'],
    genreHints: [9648, 80, 53],
  },
  {
    id: 'epic-odyssey',
    emoji: '🚀',
    label: 'Monumental Space Odyssey',
    prompt: 'Epic scale space saga with breathtaking visuals and orchestral score',
    keywords: ['dune', 'star', 'space', 'planet', 'galaxy', 'odyssey', 'empire', 'alien'],
    genreHints: [878, 12],
  },
  {
    id: 'high-fantasy',
    emoji: '🐉',
    label: 'Mythical Kingdom War',
    prompt: 'High fantasy kingdoms, dragons, and ancient ring conquests',
    keywords: ['ring', 'dragon', 'throne', 'lord', 'hobbit', 'sword', 'magic', 'kingdom'],
    genreHints: [14, 28],
  },
];

export const VibeSearchModal: React.FC<VibeSearchModalProps> = ({
  isOpen,
  onClose,
  onPlayMedia,
  onSelectMedia,
  catalogItems,
}) => {
  const [query, setQuery] = useState('');
  const [activePreset, setActivePreset] = useState<VibePreset | null>(VIBE_PRESETS[0]);

  // Combine unique items from catalog and universes
  const allPool = useMemo(() => {
    const universeTitles = FRANCHISE_UNIVERSES.flatMap(u => u.items);
    const map = new Map<number, MediaItem>();
    [...catalogItems, ...universeTitles].forEach(it => {
      if (it && it.id && !map.has(it.id)) {
        map.set(it.id, it);
      }
    });
    return Array.from(map.values());
  }, [catalogItems]);

  // Semantic search calculation
  const results = useMemo(() => {
    const activeText = query.trim() || activePreset?.prompt || '';
    if (!activeText) {
      return allPool.slice(0, 8).map(item => ({
        item,
        score: item.vote_average || 0,
        rationale: 'Trending & High-Rated Pick',
      }));
    }

    const tokens = activeText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const scored = allPool.map(item => {
      let score = 0;
      const rationale: string[] = [];
      const titleLower = (item.title || item.name || '').toLowerCase();
      const overviewLower = (item.overview || '').toLowerCase();

      // Check tokens
      tokens.forEach(tok => {
        if (titleLower.includes(tok)) {
          score += 6;
          rationale.push(`Title matches "${tok}"`);
        }
        if (overviewLower.includes(tok)) {
          score += 2;
        }
      });

      // Check preset keyword boosters
      if (activePreset) {
        activePreset.keywords.forEach(kw => {
          if (titleLower.includes(kw) || overviewLower.includes(kw)) {
            score += 3;
            if (!rationale.includes(`Tone: ${activePreset.label}`)) {
              rationale.push(`Matches ${activePreset.label}`);
            }
          }
        });

        if (item.genre_ids) {
          activePreset.genreHints.forEach(gh => {
            if (item.genre_ids?.includes(gh)) {
              score += 2;
            }
          });
        }
      }

      // Quality booster
      if (item.vote_average) {
        score += item.vote_average * 0.5;
      }

      return {
        item,
        score,
        rationale: rationale.slice(0, 2).join(' • ') || 'Aesthetic & mood match',
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [allPool, query, activePreset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85  flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0e101a] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>AI Vibe Search & Cinema Concierge</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Semantic Engine
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Describe the feeling, setting, or aesthetic you want to experience tonight.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="mt-5 relative">
          <Search className="w-5 h-5 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActivePreset(null);
            }}
            placeholder="e.g. A rainy neon-lit Tokyo thriller with synthwave music, under 2 hours..."
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-gray-500 text-sm pl-12 pr-12 py-3.5 rounded-2xl border border-white/15 focus:border-indigo-400 focus:outline-none transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Curated Vibe Preset Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-gray-400 shrink-0">Try a vibe:</span>
          {VIBE_PRESETS.map(preset => {
            const isSelected = activePreset?.id === preset.id && !query;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePreset(preset);
                  setQuery('');
                  playSelectSound();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Curated Vibe Match Reel ({results.length})</span>
            </span>
            <span className="text-[11px] text-gray-400">1-Click 4K Streaming</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-h-[460px] overflow-y-auto pr-1">
            {results.map(({ item, rationale }) => {
              const title = item.title || item.name || 'Untitled';
              const poster = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : null;

              return (
                <div
                  key={`${item.media_type}-${item.id}`}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
                >
                  <div
                    onClick={() => {
                      onSelectMedia(item);
                      onClose();
                    }}
                    className="cursor-pointer"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full bg-black overflow-hidden">
                      {poster ? (
                        <img
                          src={poster}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Film className="w-8 h-8" />
                        </div>
                      )}

                      {/* Rationale Overlay Badge */}
                      <div className="absolute top-2 left-2 right-2">
                        <span className="px-2 py-1 rounded-md bg-black/80  border border-indigo-500/40 text-[9px] font-bold text-indigo-200 block truncate shadow-lg">
                          ✨ {rationale}
                        </span>
                      </div>

                      {/* Rating pill */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80  border border-white/20 text-[10px] font-black text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{item.vote_average ? item.vote_average.toFixed(1) : '7.8'}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3">
                      <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                        {title}
                      </h4>
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.overview}
                      </p>
                    </div>
                  </div>

                  {/* Play Action Button */}
                  <div className="p-3 pt-0">
                    <button
                      onClick={() => {
                        onPlayMedia(item);
                        onClose();
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Stream in 4K</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
