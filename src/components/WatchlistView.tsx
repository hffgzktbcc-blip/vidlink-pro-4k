import React, { useState } from 'react';
import { Bookmark, History, Play, Trash2 } from 'lucide-react';
import type { MediaItem, WatchHistoryItem } from '../types';
import { MediaCard } from './MediaCard';
import { getImageUrl } from '../services/tmdb';

interface WatchlistViewProps {
  watchlist: MediaItem[];
  history: WatchHistoryItem[];
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem, season?: number, episode?: number) => void;
  onRemoveFromWatchlist: (id: number) => void;
  onRemoveFromHistory: (id: number, mediaType: any) => void;
  onClearHistory: () => void;
  onExplore: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  history,
  onSelectMedia,
  onPlayMedia,
  onRemoveFromWatchlist,
  onRemoveFromHistory,
  onClearHistory,
  onExplore,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'watchlist' | 'history'>('watchlist');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-indigo-400" />
            <span>Library & Watchlist</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Access your saved movies, series, and continue watching where you left off.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('watchlist')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'watchlist'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>My List ({watchlist.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'history'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Continue Watching ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Watchlist Content */}
      {activeSubTab === 'watchlist' && (
        <>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {watchlist.map(item => (
                <MediaCard
                  key={`${item.media_type}-${item.id}`}
                  item={item}
                  onSelect={onSelectMedia}
                  onPlay={onPlayMedia}
                  isInWatchlist={true}
                  onToggleWatchlist={() => onRemoveFromWatchlist(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 p-8">
              <Bookmark className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Your Watchlist is empty</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                Click the "+ Add to List" button on any movie or TV series card to save it here for later.
              </p>
              <button
                onClick={onExplore}
                className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Browse 4K Trending Releases
              </button>
            </div>
          )}
        </>
      )}

      {/* Continue Watching / History Content */}
      {activeSubTab === 'history' && (
        <div>
          {history.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={onClearHistory}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Watch History</span>
              </button>
            </div>
          )}

          {history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map(item => {
                const isTV = item.mediaType === 'tv';
                return (
                  <div
                    key={`${item.mediaType}-${item.id}`}
                    className="glass-panel p-3.5 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all flex gap-3 group"
                  >
                    <img
                      src={getImageUrl(item.posterPath, 'w300')}
                      alt={item.title}
                      className="w-20 h-28 object-cover rounded-xl shrink-0 shadow bg-black/40"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-indigo-500/20 text-indigo-300">
                            {isTV ? 'TV Series' : 'Movie'}
                          </span>
                          <button
                            onClick={() => onRemoveFromHistory(item.id, item.mediaType)}
                            className="text-gray-500 hover:text-red-400 p-1"
                            title="Remove from history"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate mt-1">
                          {item.title}
                        </h4>
                        {isTV && item.season && item.episode && (
                          <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                            Season {item.season} • Episode {item.episode}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          onPlayMedia(
                            {
                              id: item.id,
                              title: item.title,
                              name: item.title,
                              media_type: item.mediaType,
                              overview: '',
                              poster_path: item.posterPath,
                              backdrop_path: item.backdropPath,
                              vote_average: 8.0,
                              vote_count: 100,
                            },
                            item.season || 1,
                            item.episode || 1
                          )
                        }
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume Playback</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 p-8">
              <History className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No stream history yet</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                When you stream a movie or episode in VidLink Pro 4K, it will appear here so you can pick up right where you left off.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
