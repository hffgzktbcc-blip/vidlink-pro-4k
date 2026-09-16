import React, { useState, useEffect } from 'react';
import { X, Star, Play } from 'lucide-react';
import type { MediaItem } from '../types';
import { getImageUrl, createTmdbClient } from '../services/tmdb';
import { playSelectSound } from '../services/soundEffects';

interface ActorFilmographyModalProps {
  actor: { id: number; name: string; profile_path: string | null; character?: string } | null;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
  onPlayMedia?: (item: MediaItem) => void;
}

export const ActorFilmographyModal: React.FC<ActorFilmographyModalProps> = ({
  actor,
  onClose,
  onSelectMedia,
  onPlay,
  onPlayMedia,
}) => {
  const handlePlay = onPlayMedia || onPlay || (() => {});
  const [credits, setCredits] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    let isMounted = true;
    setIsLoading(true);

    const fetchCredits = async () => {
      try {
        const client = createTmdbClient();
        const res = await client.get(`/person/${actor.id}/combined_credits`);
        if (!isMounted) return;

        if (res.data?.cast?.length) {
          const valid = res.data.cast
            .filter((c: any) => c.poster_path && (c.vote_count || 0) > 20)
            .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 18)
            .map((c: any) => ({
              ...c,
              media_type: c.media_type || (c.title ? 'movie' : 'tv'),
              is4K: true,
            }));
          setCredits(valid);
        }
      } catch (err) {
        console.warn('Could not fetch actor filmography', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCredits();

    return () => {
      isMounted = false;
    };
  }, [actor]);

  if (!actor) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl bg-[#0e101a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header with Actor info */}
        <div className="p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={getImageUrl(actor.profile_path, 'w300')}
              alt={actor.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl bg-black"
            />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Filmography & Starring Roles
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white">
                {actor.name}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Known for: {actor.character || 'Leading Roles'} • {credits.length} Available Titles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filmography Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : credits.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No additional titles found for this actor.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {credits.map(item => {
                const itemTitle = item.title || item.name || '';
                const itemYear = (item.release_date || item.first_air_date || '').split('-')[0];
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      playSelectSound();
                      onSelectMedia(item);
                      onClose();
                    }}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer select-none card-hover-effect focus:outline-none"
                  >
                    <div className="relative aspect-[2/3] w-full bg-[#10121d] rounded-2xl overflow-hidden border border-white/10 group-hover:border-indigo-500/70 shadow-lg">
                      <img
                        src={getImageUrl(item.poster_path, 'w500')}
                        alt={itemTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handlePlay(item);
                            onClose();
                          }}
                          className="w-full py-1.5 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                        >
                          <Play className="w-3 h-3 fill-black" />
                          <span>Watch</span>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-gray-200 group-hover:text-white truncate mt-1.5">
                      {itemTitle}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{itemYear || '2024'}</span>
                      {item.vote_average ? (
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {item.vote_average.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
