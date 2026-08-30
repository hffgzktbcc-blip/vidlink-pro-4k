import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Plus,
  Check,
  Star,
  Users,
  Video,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import type { MediaItem, MediaType, Season } from '../types';
import {
  getImageUrl,
  getBackdropUrl,
  fetchMediaDetails,
  fetchSeasonDetails,
} from '../services/tmdb';

interface MediaDetailModalProps {
  media: MediaItem | null;
  onClose: () => void;
  onPlay: (item: MediaItem, season?: number, episode?: number) => void;
  onOpenTrailer: (item: MediaItem) => void;
  isInWatchlist: (id: number) => boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  onClose,
  onPlay,
  onOpenTrailer,
  isInWatchlist,
  onToggleWatchlist,
}) => {
  const [detailedItem, setDetailedItem] = useState<MediaItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [activeTab, setActiveTab] = useState<'episodes' | 'cast' | 'similar'>('episodes');

  const isTV = media?.media_type === 'tv' || (!media?.title && !!media?.name);
  const mediaType: MediaType = isTV ? 'tv' : 'movie';

  // Fetch full details
  useEffect(() => {
    if (media) {
      fetchMediaDetails(mediaType, media.id)
        .then(data => {
          setDetailedItem(data);
        })
        .catch(console.error);
    }
  }, [media, mediaType]);

  // Fetch TV season data
  useEffect(() => {
    if (media && isTV) {
      fetchSeasonDetails(media.id, selectedSeason)
        .then(data => setSeasonData(data))
        .catch(console.error);
    }
  }, [media, isTV, selectedSeason]);

  // Keyboard shortcut listener for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!media) return null;

  const current = detailedItem || media;
  const title = current.title || current.name || 'Untitled';
  const year = (current.release_date || current.first_air_date || '').split('-')[0];
  const saved = isInWatchlist(current.id);
  const totalSeasons = current.number_of_seasons || 1;
  const castList = current.credits?.cast?.slice(0, 10) || [];
  const similarList = current.similar?.results?.slice(0, 8) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0e101a] border border-white/15 rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-black">
          <img
            src={getBackdropUrl(current.backdrop_path, 'w1280')}
            alt={title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e101a] via-[#0e101a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e101a] via-transparent to-transparent" />

          {/* Quick info over backdrop */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-6">
            {/* Poster Thumbnail */}
            <img
              src={getImageUrl(current.poster_path, 'w500')}
              alt={title}
              className="w-28 sm:w-40 aspect-[2/3] object-cover rounded-2xl border-2 border-white/20 shadow-2xl shrink-0 hidden sm:block"
            />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase rounded bg-gradient-to-r from-amber-500 to-orange-500 text-black">
                  4K ULTRA HD
                </span>
                <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                  {isTV ? 'TV SERIES' : 'MOVIE'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-gray-300 font-medium">
                {current.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {current.vote_average.toFixed(1)} / 10
                  </span>
                )}
                {year && <span>{year}</span>}
                {current.runtime && <span>{Math.floor(current.runtime / 60)}h {current.runtime % 60}m</span>}
                {isTV && <span>{totalSeasons} {totalSeasons === 1 ? 'Season' : 'Seasons'}</span>}
                <span className="text-emerald-400 font-semibold">• Ultra HD Stream</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3.5 pb-6 border-b border-white/10">
            {/* Play Button */}
            <button
              onClick={() => {
                onPlay(current, 1, 1);
                onClose();
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-indigo-600/30 transform hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Watch in 4K Now</span>
            </button>

            {/* Watch Trailer Button */}
            <button
              onClick={() => onOpenTrailer(current)}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center gap-2 border border-white/15 transition-all"
            >
              <Video className="w-4 h-4 text-indigo-400" />
              <span>Watch Trailer</span>
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={() => onToggleWatchlist(current)}
              className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 border transition-all ${
                saved
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{saved ? 'In Watchlist' : 'Add to List'}</span>
            </button>
          </div>

          {/* Synopsis */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Storyline
            </h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {current.overview || 'No synopsis available.'}
            </p>
          </div>

          {/* Genres Chips */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {current.genres.map(g => (
                <span
                  key={g.id}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-300"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="border-b border-white/10 flex items-center gap-4 text-sm font-semibold">
            {isTV && (
              <button
                onClick={() => setActiveTab('episodes')}
                className={`pb-3 flex items-center gap-2 transition-colors relative ${
                  activeTab === 'episodes' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>Episodes ({totalSeasons} Seasons)</span>
                {activeTab === 'episodes' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('cast')}
              className={`pb-3 flex items-center gap-2 transition-colors relative ${
                activeTab === 'cast' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Top Cast</span>
              {activeTab === 'cast' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>

            {similarList.length > 0 && (
              <button
                onClick={() => setActiveTab('similar')}
                className={`pb-3 flex items-center gap-2 transition-colors relative ${
                  activeTab === 'similar' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>More Like This</span>
                {activeTab === 'similar' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            )}
          </div>

          {/* Tab Content: TV Episodes */}
          {isTV && activeTab === 'episodes' && (
            <div className="space-y-4">
              {/* Season Selection Dropdown */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Select Season:
                </span>
                <select
                  value={selectedSeason}
                  onChange={e => setSelectedSeason(Number(e.target.value))}
                  className="bg-[#181a28] border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {Array.from({ length: totalSeasons }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Season {idx + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Episodes List */}
              <div className="divide-y divide-white/5 space-y-3">
                {(seasonData?.episodes || []).map(ep => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      onPlay(current, selectedSeason, ep.episode_number);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl hover:bg-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer transition-all group"
                  >
                    {/* Thumbnail Still */}
                    <div className="relative w-full sm:w-44 aspect-video bg-black/50 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <img
                        src={getImageUrl(ep.still_path || current.backdrop_path, 'w500')}
                        alt={ep.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 rounded-full bg-indigo-600 text-white shadow-lg">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Episode Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 truncate">
                          {ep.episode_number}. {ep.name}
                        </h4>
                        {ep.runtime && (
                          <span className="text-xs text-gray-400 shrink-0">
                            {ep.runtime} min
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {ep.overview || 'Stream this episode in 4K Ultra HD.'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.2 text-[10px] font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Play Episode
                        </span>
                        {ep.air_date && (
                          <span className="text-[11px] text-gray-400">
                            Aired: {ep.air_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: Cast */}
          {activeTab === 'cast' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {castList.map(actor => (
                <div
                  key={actor.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center flex flex-col items-center"
                >
                  <img
                    src={getImageUrl(actor.profile_path, 'w300')}
                    alt={actor.name}
                    className="w-20 h-20 rounded-full object-cover mb-2 border border-white/10 shadow bg-black/40"
                  />
                  <h4 className="text-xs font-bold text-white truncate w-full">
                    {actor.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate w-full mt-0.5">
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: Similar */}
          {activeTab === 'similar' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarList.map(sim => (
                <div
                  key={sim.id}
                  onClick={() => {
                    setDetailedItem(sim);
                  }}
                  className="rounded-xl overflow-hidden cursor-pointer group bg-white/5 border border-white/5 hover:border-indigo-500/50 transition-all"
                >
                  <img
                    src={getImageUrl(sim.poster_path, 'w500')}
                    alt={sim.title || sim.name}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-2.5">
                    <h5 className="text-xs font-bold text-white truncate">
                      {sim.title || sim.name}
                    </h5>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
