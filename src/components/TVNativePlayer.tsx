import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Tv,
  Film,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import type { MediaItem } from '../types';
import { openInExternalPlayer, type DirectStream } from '../services/streamResolver';

interface TVNativePlayerProps {
  media: MediaItem;
  stream: DirectStream;
  season?: number;
  episode?: number;
  episodeName?: string;
  onClose: () => void;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrevEpisode?: boolean;
  hasNextEpisode?: boolean;
  onSwitchToEmbed?: () => void;
}

export const TVNativePlayer: React.FC<TVNativePlayerProps> = ({
  media,
  stream,
  season = 1,
  episode = 1,
  episodeName,
  onClose,
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode = false,
  hasNextEpisode = false,
  onSwitchToEmbed,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [seekFeedback, setSeekFeedback] = useState<'forward' | 'backward' | null>(null);
  const [playStateFeedback, setPlayStateFeedback] = useState<'play' | 'pause' | null>(null);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTV = media.media_type === 'tv' || (!media.title && !!media.name);
  const title = media.title || media.name || 'Now Playing';

  // Format seconds into HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reset controls hide timer
  const triggerActivity = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  // Show quick on-screen seek feedback (-10s / +10s)
  const triggerSeekFeedback = (direction: 'forward' | 'backward') => {
    setSeekFeedback(direction);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setSeekFeedback(null);
    }, 900);
  };

  // Show play/pause center feedback
  const triggerPlayFeedback = (state: 'play' | 'pause') => {
    setPlayStateFeedback(state);
    setTimeout(() => {
      setPlayStateFeedback(null);
    }, 700);
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      triggerPlayFeedback('play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerPlayFeedback('pause');
    }
    triggerActivity();
  }, [triggerActivity]);

  // Fast seek by offset (+10s or -10s)
  const seekBy = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return;
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration || Infinity);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      triggerSeekFeedback(seconds > 0 ? 'forward' : 'backward');
      triggerActivity();
    },
    [duration, triggerActivity]
  );

  // Initialize HLS / Native Video Playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream.isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(stream.url);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              if (onSwitchToEmbed) {
                onSwitchToEmbed();
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !stream.isM3U8) {
      // Native Safari / Android HLS or direct MP4
      video.src = stream.url;
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream]);

  // Track video time & buffer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('progress', onProgress);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('progress', onProgress);
    };
  }, []);

  // 100% Android TV Remote Control Keyboard Navigation (D-Pad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const keyCode = e.keyCode;

      // Handle Back Key (TV Remote Back = keyCode 4 or 10009 or Escape)
      if (key === 'Escape' || key === 'GoBack' || keyCode === 4 || keyCode === 10009) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
        return;
      }

      // Enter / OK button / Media Play/Pause -> Play / Pause
      const isPlayPause =
        key === 'Enter' ||
        key === ' ' ||
        key === 'Select' ||
        key === 'Accept' ||
        key === 'MediaPlayPause' ||
        keyCode === 23 ||
        keyCode === 13 ||
        keyCode === 85 ||
        keyCode === 126 ||
        keyCode === 127;

      if (isPlayPause) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        togglePlay();
        return;
      }

      // D-Pad Left / Media Rewind -> Rewind 10s
      if (key === 'ArrowLeft' || key === 'MediaRewind' || keyCode === 21 || keyCode === 89) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        seekBy(-10);
        return;
      }

      // D-Pad Right / Media Fast Forward -> Fast-Forward 10s
      if (key === 'ArrowRight' || key === 'MediaFastForward' || keyCode === 22 || keyCode === 90) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        seekBy(10);
        return;
      }

      // D-Pad Up -> Show OSD Controls
      if (key === 'ArrowUp' || keyCode === 19) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowControls(true);
        triggerActivity();
        return;
      }

      // D-Pad Down -> Hide OSD Controls
      if (key === 'ArrowDown' || keyCode === 20) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowControls(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onClose, togglePlay, seekBy, triggerActivity]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none"
      onClick={triggerActivity}
    >
      {/* Native Hardware GPU Accelerated Video Tag */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black cursor-pointer"
        playsInline
        autoPlay
        onClick={togglePlay}
      />

      {/* Central Play/Pause Animation Feedback */}
      {playStateFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="p-6 rounded-full bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-2xl animate-ping opacity-75">
            {playStateFeedback === 'play' ? (
              <Play className="w-12 h-12 fill-white" />
            ) : (
              <Pause className="w-12 h-12 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* D-Pad Skip Feedback Bubble (-10s / +10s) */}
      {seekFeedback && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-40 pointer-events-none ${
            seekFeedback === 'forward' ? 'right-12' : 'left-12'
          }`}
        >
          <div className="px-5 py-3 rounded-2xl bg-black/85 border border-indigo-500/40 text-white flex items-center gap-2 backdrop-blur-lg shadow-2xl">
            {seekFeedback === 'forward' ? (
              <>
                <span className="text-base font-black tracking-wide">+10s</span>
                <RotateCw className="w-5 h-5 text-amber-400" />
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <span className="text-base font-black tracking-wide">-10s</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dedicated Always-Accessible Mobile Back & Exit Button */}
      <button
        onClick={onClose}
        className="fixed top-4 left-4 z-50 p-3 sm:p-3.5 rounded-full bg-black/80 hover:bg-red-600 text-white border border-white/20 backdrop-blur-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
        aria-label="Exit Player"
        title="Exit Player & Return to Catalog (Esc / Back)"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-xs font-bold sm:hidden">Exit</span>
      </button>

      {/* Top Header Bar (Auto-Fading) */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 p-5 pl-20 sm:pl-24 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between gap-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shrink-0">
            {isTV ? <Tv className="w-5 h-5" /> : <Film className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white truncate max-w-md">
                {title}
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Direct HLS
              </span>
            </div>
            {isTV && (
              <p className="text-xs text-indigo-300 font-medium truncate">
                Season {season} • Episode {episode} {episodeName ? `• ${episodeName}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {/* Switch to Embed Mirror */}
          {onSwitchToEmbed && (
            <button
              onClick={onSwitchToEmbed}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-all"
              title="Switch to Embed Mirror Players"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Embed Mirrors</span>
            </button>
          )}

          {/* Open in External TV Player (Just Player / VLC) */}
          <button
            onClick={() => openInExternalPlayer(stream.url, title)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600/40 text-gray-200 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-all"
            title="Open in Just Player or VLC on Android TV"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">VLC / Just Player</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-all shadow-lg"
            title="Exit Player (Esc / Back)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Cinematic OSD Bar (Auto-Fading) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar with Buffer Indicator */}
        <div className="relative w-full h-3 bg-white/15 rounded-full overflow-hidden cursor-pointer group">
          {/* Buffered Stream Progress */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/30 transition-all duration-300 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* Active Played Progress */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-100 rounded-full shadow-lg"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Bottom Navigation & Controls Row */}
        <div className="flex items-center justify-between gap-4 mt-1">
          {/* Play / Pause / Seek Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400 transition-all"
              title="Play / Pause (OK)"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              onClick={() => seekBy(-10)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
              title="Rewind 10 Seconds (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekBy(10)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
              title="Fast-Forward 10 Seconds (Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Previous / Next Episode for TV shows */}
            {isTV && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={onPrevEpisode}
                  disabled={!hasPrevEpisode}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white border border-white/15 transition-all"
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={onNextEpisode}
                  disabled={!hasNextEpisode}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white border border-white/15 transition-all"
                  title="Next Episode"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Time Stamp Display */}
            <div className="text-xs sm:text-sm font-mono font-bold text-gray-200 ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-gray-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Status & TV Remote Helper */}
          <div className="flex items-center gap-4 text-[11px] text-gray-300">
            <span className="hidden md:inline px-3 py-1 rounded-xl bg-white/10 border border-white/15">
              🎮 <b>OK</b>: Play/Pause • <b>◀/▶</b>: Skip 10s • <b>▲/▼</b>: Controls • <b>Back</b>: Exit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
