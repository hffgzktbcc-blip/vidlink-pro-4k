import React, { useEffect } from 'react';
import { X, Video } from 'lucide-react';
import type { MediaItem } from '../types';

interface TrailerModalProps {
  media: MediaItem | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ media, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!media) return null;

  const title = media.title || media.name || 'Trailer';
  const trailerVideo =
    media.videos?.results?.find(
      v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    ) || media.videos?.results?.[0];

  const youtubeKey = trailerVideo?.key || 'Way9Dexny3w';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#10121d] border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {title} — Official 4K Trailer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`}
            title={`${title} Trailer`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
