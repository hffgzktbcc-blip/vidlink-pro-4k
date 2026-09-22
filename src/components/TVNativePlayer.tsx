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
  Users,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Maximize,
  Minimize,
} from 'lucide-react';
import type { MediaItem } from '../types';
import { openInExternalPlayer, type DirectStream } from '../services/streamResolver';
import { watchPartyManager } from '../services/watchParty';
import { WatchPartyReactions } from './WatchPartyReactions';
import {
  isFullscreenActive,
  toggleFullscreen,
  subscribeToFullscreenChange,
} from '../utils/fullscreen';

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
  onOpenPartyModal?: () => void;
  allStreams?: DirectStream[];
  onOpenStreamSelector?: () => void;
  onSelectStream?: (s: DirectStream) => void;
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
  onOpenPartyModal,
  allStreams = [],
  onOpenStreamSelector,
  onSelectStream,
}) => {
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [seekFeedback, setSeekFeedback] = useState<'forward' | 'backward' | null>(null);
  const [playStateFeedback, setPlayStateFeedback] = useState<'play' | 'pause' | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isCopyrightNoticeOpen, setIsCopyrightNoticeOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive());

  useEffect(() => {
    setIsFullscreen(isFullscreenActive());
    const unsub = subscribeToFullscreenChange(active => {
      setIsFullscreen(active);
    });
    return unsub;
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreen(playerContainerRef.current || videoRef.current);
  }, []);

  const handleSwitchToNextStream = useCallback(() => {
    if (!onSelectStream || allStreams.length <= 1) return;
    const currentIndex = allStreams.findIndex(s => s.url === stream.url);
    let nextIndex = (currentIndex + 1) % allStreams.length;
    for (let i = 1; i < allStreams.length; i++) {
      const idx = (currentIndex + i) % allStreams.length;
      if (!allStreams[idx].isHighDmcaRisk) {
        nextIndex = idx;
        break;
      }
    }
    setIsCopyrightNoticeOpen(false);
    setVideoError(null);
    onSelectStream(allStreams[nextIndex]);
  }, [allStreams, onSelectStream, stream.url]);

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (videoRef.current) {
      videoRef.current.playbackRate = next;
    }
  };

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteSyncRef = useRef(false);

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

  // Play / Pause toggle with P2P Watch Party broadcast
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      triggerPlayFeedback('play');
      if (!isRemoteSyncRef.current) {
        watchPartyManager.broadcastSync({
          action: 'PLAY',
          currentTime: videoRef.current.currentTime,
          season: isTV ? season : undefined,
          episode: isTV ? episode : undefined,
          mediaId: media.id,
          mediaType: isTV ? 'tv' : 'movie',
        });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerPlayFeedback('pause');
      if (!isRemoteSyncRef.current) {
        watchPartyManager.broadcastSync({
          action: 'PAUSE',
          currentTime: videoRef.current.currentTime,
          season: isTV ? season : undefined,
          episode: isTV ? episode : undefined,
          mediaId: media.id,
          mediaType: isTV ? 'tv' : 'movie',
        });
      }
    }
    isRemoteSyncRef.current = false;
    triggerActivity();
  }, [triggerActivity, isTV, season, episode, media.id]);

  // Fast seek by offset (+10s or -10s) with P2P Watch Party broadcast
  const seekBy = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return;
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration || Infinity);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      triggerSeekFeedback(seconds > 0 ? 'forward' : 'backward');
      if (!isRemoteSyncRef.current) {
        watchPartyManager.broadcastSync({
          action: 'SEEK',
          currentTime: newTime,
          season: isTV ? season : undefined,
          episode: isTV ? episode : undefined,
          mediaId: media.id,
          mediaType: isTV ? 'tv' : 'movie',
        });
      }
      isRemoteSyncRef.current = false;
      triggerActivity();
    },
    [duration, triggerActivity, isTV, season, episode, media.id]
  );

  // Subscribe to incoming P2P Watch Party Sync commands
  useEffect(() => {
    const unsub = watchPartyManager.subscribe(
      msg => {
        if (msg.type === 'SYNC' && msg.payload) {
          const { action, currentTime: targetTime, episode: targetEpisode } = msg.payload;
          const video = videoRef.current;
          if (!video) return;

          if (isTV && targetEpisode !== undefined && targetEpisode !== episode) {
            if (targetEpisode > episode && onNextEpisode) {
              onNextEpisode();
            } else if (targetEpisode < episode && onPrevEpisode) {
              onPrevEpisode();
            }
          }

          if (action === 'PLAY') {
            if (video.paused) {
              isRemoteSyncRef.current = true;
              video.play().catch(console.error);
              setIsPlaying(true);
              triggerPlayFeedback('play');
            }
          } else if (action === 'PAUSE') {
            if (!video.paused) {
              isRemoteSyncRef.current = true;
              video.pause();
              setIsPlaying(false);
              triggerPlayFeedback('pause');
            }
          } else if (action === 'SEEK') {
            if (typeof targetTime === 'number' && Math.abs(video.currentTime - targetTime) > 1.5) {
              isRemoteSyncRef.current = true;
              video.currentTime = targetTime;
              setCurrentTime(targetTime);
            }
          }
        }
      },
      () => {}
    );
    return unsub;
  }, [episode, isTV, onNextEpisode, onPrevEpisode]);

  // Initialize HLS / Native Video Playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoError(null);

    const onNativeVideoError = () => {
      const isMkv = stream.container === 'mkv' || stream.url.includes('.mkv');
      if (isMkv) {
        setVideoError(
          'This 4K Blu-ray Remux uses an uncompressed MKV / Dolby Atmos container. Standard web browsers cannot decode MKV/TrueHD natively. Click below to launch in VLC or Just Player on your TV!'
        );
      } else {
        setVideoError('Video stream could not be decoded by the browser. Launch in external player or select an alternative stream.');
      }
      setIsPlaying(false);
    };

    video.addEventListener('error', onNativeVideoError);

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
              setVideoError('HLS stream encountered a playback error. Switch to another stream or free mirrors.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !stream.isM3U8) {
      // Native Safari / Android HLS or direct MP4 / MKV
      video.src = stream.url;
      video.play().catch(() => {
        setIsPlaying(false);
        if (stream.container === 'mkv' || stream.url.includes('.mkv')) {
          setVideoError(
            'This 4K Blu-ray Remux uses an MKV / Dolby TrueHD container. Launch it in VLC / Just Player for uncompressed 4K HDR & surround sound!'
          );
        }
      });
    }

    return () => {
      video.removeEventListener('error', onNativeVideoError);
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
    const onDurationChange = () => {
      const d = video.duration;
      setDuration(d);
      // Real-Debrid copyright takedown placeholder videos are ~5 to 15 seconds long
      if (d > 0 && d <= 25) {
        setIsCopyrightNoticeOpen(true);
      }
    };
    const onEnded = () => {
      // If video completed within 25 seconds, it is almost certainly a copyright notice clip
      if (video.currentTime > 0 && video.currentTime <= 25) {
        setIsCopyrightNoticeOpen(true);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('ended', onEnded);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('progress', onProgress);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('ended', onEnded);
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

      // 'F' / 'f' -> Toggle Fullscreen Cinema Mode
      if (key.toLowerCase() === 'f') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleToggleFullscreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onClose, togglePlay, seekBy, triggerActivity, handleToggleFullscreen]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
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
        onDoubleClick={handleToggleFullscreen}
      />

      {/* Codec / Playback Error Overlay */}
      {videoError && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="max-w-md w-full bg-[#0e101a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Browser Codec Notice</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              {videoError}
            </p>
            <div className="space-y-2.5">
              {onSelectStream && allStreams.length > 1 && (
                <button
                  onClick={handleSwitchToNextStream}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Try Next Stream (Auto-Skip DMCAd Release)</span>
                </button>
              )}

              <button
                onClick={() => openInExternalPlayer(stream.url, title)}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-orange-500/30 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch in VLC / Just Player</span>
              </button>

              {onOpenStreamSelector && allStreams.length > 1 && (
                <button
                  onClick={onOpenStreamSelector}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs border border-indigo-500/40 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Choose Another Stream ({allStreams.length} available)</span>
                </button>
              )}

              {onSwitchToEmbed && (
                <button
                  onClick={onSwitchToEmbed}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-2 transition-all"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Switch to Free Mirrors (VidLink Pro)</span>
                </button>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(stream.url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Stream Link Copied!' : 'Copy Direct Debrid Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Debrid Copyright Notice Detected Overlay */}
      {isCopyrightNoticeOpen && (
        <div className="absolute inset-0 z-50 bg-black/92 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="max-w-md w-full bg-[#0e101a] border border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-white mb-1.5">
              Real-Debrid Copyright Notice Detected
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-5">
              Real-Debrid filtered this specific torrent release due to copyright compliance. Alternative releases for this title or our free 4K mirrors are ready to play!
            </p>

            <div className="w-full space-y-2.5">
              {allStreams.length > 1 && onSelectStream && (
                <button
                  onClick={handleSwitchToNextStream}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Auto-Switch to Next Release ({allStreams.length} available)</span>
                </button>
              )}

              {onSwitchToEmbed && (
                <button
                  onClick={() => {
                    setIsCopyrightNoticeOpen(false);
                    onSwitchToEmbed();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold text-xs border border-indigo-500/40 flex items-center justify-center gap-2 transition-all"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Switch to Free 4K Mirrors (VidLink Pro)</span>
                </button>
              )}

              {onOpenStreamSelector && allStreams.length > 1 && (
                <button
                  onClick={() => {
                    setIsCopyrightNoticeOpen(false);
                    onOpenStreamSelector();
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Browse All Releases</span>
                </button>
              )}

              <button
                onClick={() => setIsCopyrightNoticeOpen(false)}
                className="w-full py-2 text-gray-400 hover:text-white text-xs font-medium transition-colors"
              >
                Dismiss & Keep Playing
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Dedicated Always-Accessible Mobile Back & Exit Button with iOS Safe Area */}
      <button
        onClick={onClose}
        className="fixed top-[max(1rem,env(safe-area-inset-top,16px))] left-[max(1rem,env(safe-area-inset-left,16px))] z-50 p-3 sm:p-3.5 rounded-full bg-black/80 hover:bg-red-600 text-white border border-white/20 backdrop-blur-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
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

          {/* Debrid Streams Switcher */}
          {onOpenStreamSelector && allStreams.length > 0 && (
            <button
              onClick={onOpenStreamSelector}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all"
              title="Select Real-Debrid Stream / Quality"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Streams ({allStreams.length})</span>
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

          {/* Watch Party SyncPlay Button */}
          {onOpenPartyModal && (
            <button
              onClick={onOpenPartyModal}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5 transition-all"
              title="Watch Party (P2P SyncPlay with Friends)"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Party</span>
            </button>
          )}

          {/* Copyright notice quick action */}
          <button
            onClick={() => setIsCopyrightNoticeOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Stream showing copyright warning? Switch release"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Copyright Issue?</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-md"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
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

            {/* Playback Speed Selector */}
            <button
              onClick={cycleSpeed}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold border border-white/15 transition-all ml-2"
              title="Change Playback Speed (0.75x - 2.0x)"
            >
              {playbackSpeed}x
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 ml-2"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          </div>

          {/* Right Status & TV Remote Helper */}
          <div className="flex items-center gap-4 text-[11px] text-gray-300">
            <span className="hidden md:inline px-3 py-1 rounded-xl bg-white/10 border border-white/15">
              🎮 <b>OK</b>: Play/Pause • <b>◀/▶</b>: Skip 10s • <b>▲/▼</b>: Controls • <b>Back</b>: Exit
            </span>
          </div>
        </div>
      </div>

      {/* Floating Watch Party Emoji Reactions and Reaction Bar */}
      <WatchPartyReactions
        onOpenPartyModal={onOpenPartyModal || (() => {})}
        showBar={showControls}
      />
    </div>
  );
};
