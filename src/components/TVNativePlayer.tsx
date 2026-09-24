import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Tv,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Maximize,
  Minimize,
  Volume2,
  Volume1,
  VolumeX,
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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsFullscreen(isFullscreenActive());
    const unsub = subscribeToFullscreenChange(active => setIsFullscreen(active));
    return unsub;
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreen(playerContainerRef.current || videoRef.current);
  }, []);

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
    if (!next && volume === 0) { video.volume = 0.5; setVolume(0.5); }
    showVolumePanel();
  }, [isMuted, volume]);

  const handleVolumeChange = useCallback((val: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, val));
    video.volume = clamped;
    video.muted = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
    showVolumePanel();
  }, []);

  const showVolumePanel = () => {
    setShowVolumeSlider(true);
    if (volumeHideTimer.current) clearTimeout(volumeHideTimer.current);
    volumeHideTimer.current = setTimeout(() => setShowVolumeSlider(false), 2500);
  };

  const handleSwitchToNextStream = useCallback(() => {
    if (!onSelectStream || allStreams.length <= 1) return;
    const currentIndex = allStreams.findIndex(s => s.url === stream.url);
    let nextIndex = (currentIndex + 1) % allStreams.length;
    for (let i = 1; i < allStreams.length; i++) {
      const idx = (currentIndex + i) % allStreams.length;
      if (!allStreams[idx].isHighDmcaRisk) { nextIndex = idx; break; }
    }
    setIsCopyrightNoticeOpen(false);
    setVideoError(null);
    onSelectStream(allStreams[nextIndex]);
  }, [allStreams, onSelectStream, stream.url]);

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteSyncRef = useRef(false);

  const isTV = media.media_type === 'tv' || (!media.title && !!media.name);
  const title = media.title || media.name || 'Now Playing';

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const triggerActivity = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  const triggerSeekFeedback = (direction: 'forward' | 'backward') => {
    setSeekFeedback(direction);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setSeekFeedback(null), 900);
  };

  const triggerPlayFeedback = (state: 'play' | 'pause') => {
    setPlayStateFeedback(state);
    setTimeout(() => setPlayStateFeedback(null), 700);
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      triggerPlayFeedback('play');
      if (!isRemoteSyncRef.current) watchPartyManager.broadcastSync({ action: 'PLAY', currentTime: videoRef.current.currentTime, season: isTV ? season : undefined, episode: isTV ? episode : undefined, mediaId: media.id, mediaType: isTV ? 'tv' : 'movie' });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerPlayFeedback('pause');
      if (!isRemoteSyncRef.current) watchPartyManager.broadcastSync({ action: 'PAUSE', currentTime: videoRef.current.currentTime, season: isTV ? season : undefined, episode: isTV ? episode : undefined, mediaId: media.id, mediaType: isTV ? 'tv' : 'movie' });
    }
    isRemoteSyncRef.current = false;
    triggerActivity();
  }, [triggerActivity, isTV, season, episode, media.id]);

  const seekBy = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return;
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration || Infinity);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      triggerSeekFeedback(seconds > 0 ? 'forward' : 'backward');
      if (!isRemoteSyncRef.current) watchPartyManager.broadcastSync({ action: 'SEEK', currentTime: newTime, season: isTV ? season : undefined, episode: isTV ? episode : undefined, mediaId: media.id, mediaType: isTV ? 'tv' : 'movie' });
      isRemoteSyncRef.current = false;
      triggerActivity();
    },
    [duration, triggerActivity, isTV, season, episode, media.id]
  );

  useEffect(() => {
    const unsub = watchPartyManager.subscribe(
      msg => {
        if (msg.type === 'SYNC' && msg.payload) {
          const { action, currentTime: targetTime, episode: targetEpisode } = msg.payload;
          const video = videoRef.current;
          if (!video) return;
          if (isTV && targetEpisode !== undefined && targetEpisode !== episode) {
            if (targetEpisode > episode && onNextEpisode) onNextEpisode();
            else if (targetEpisode < episode && onPrevEpisode) onPrevEpisode();
          }
          if (action === 'PLAY' && video.paused) { isRemoteSyncRef.current = true; video.play().catch(console.error); setIsPlaying(true); triggerPlayFeedback('play'); }
          else if (action === 'PAUSE' && !video.paused) { isRemoteSyncRef.current = true; video.pause(); setIsPlaying(false); triggerPlayFeedback('pause'); }
          else if (action === 'SEEK' && typeof targetTime === 'number' && Math.abs(video.currentTime - targetTime) > 1.5) { isRemoteSyncRef.current = true; video.currentTime = targetTime; setCurrentTime(targetTime); }
        }
      },
      () => {}
    );
    return unsub;
  }, [episode, isTV, onNextEpisode, onPrevEpisode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoError(null);
    const onNativeVideoError = () => {
      const isMkv = stream.container === 'mkv' || stream.url.includes('.mkv');
      setVideoError(isMkv ? 'This stream uses an MKV container that browsers cannot decode natively. Try another option or open in VLC.' : 'Stream could not be decoded. Try another option.');
      setIsPlaying(false);
    };
    video.addEventListener('error', onNativeVideoError);
    if (stream.isM3U8 && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 });
      hls.loadSource(stream.url);
      hls.attachMedia(video);
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => setIsPlaying(false)); });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else { hls.destroy(); setVideoError('Stream playback error. Try another option.'); }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !stream.isM3U8) {
      video.src = stream.url;
      video.play().catch(() => {
        setIsPlaying(false);
        if (stream.container === 'mkv' || stream.url.includes('.mkv')) setVideoError('MKV container detected. Open in VLC for best quality.');
      });
    }
    return () => {
      video.removeEventListener('error', onNativeVideoError);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => { const d = video.duration; setDuration(d); if (d > 0 && d <= 25) setIsCopyrightNoticeOpen(true); };
    const onEnded = () => { if (video.currentTime > 0 && video.currentTime <= 25) setIsCopyrightNoticeOpen(true); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onProgress = () => { if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1)); };
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const kc = e.keyCode;
      if (key === 'Escape' || key === 'GoBack' || kc === 4 || kc === 10009) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); onClose(); return; }
      const isPlayPause = key === 'Enter' || key === ' ' || key === 'Select' || key === 'Accept' || key === 'MediaPlayPause' || kc === 23 || kc === 13 || kc === 85 || kc === 126 || kc === 127;
      if (isPlayPause) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); togglePlay(); return; }
      if (key === 'ArrowLeft' || key === 'MediaRewind' || kc === 21 || kc === 89) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); seekBy(-10); return; }
      if (key === 'ArrowRight' || key === 'MediaFastForward' || kc === 22 || kc === 90) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); seekBy(10); return; }
      if (key === 'ArrowUp' || kc === 19) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); setShowControls(true); triggerActivity(); return; }
      if (key === 'ArrowDown' || kc === 20) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); setShowControls(false); return; }
      if (key.toLowerCase() === 'f') { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); handleToggleFullscreen(); return; }
      if (key.toLowerCase() === 'm') { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); handleToggleMute(); return; }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onClose, togglePlay, seekBy, triggerActivity, handleToggleFullscreen, handleToggleMute]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      data-tv-modal="true"
      className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none"
      onClick={triggerActivity}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black cursor-pointer"
        playsInline
        autoPlay
        onClick={togglePlay}
        onDoubleClick={handleToggleFullscreen}
      />

      {/* Playback Error */}
      {videoError && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="max-w-md w-full bg-[#0e101a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Playback Notice</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">{videoError}</p>
            <div className="space-y-2.5">
              {onSelectStream && allStreams.length > 1 && (
                <button onClick={handleSwitchToNextStream} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Play className="w-4 h-4 fill-black" /><span>Try Another Option</span>
                </button>
              )}
              <button onClick={() => openInExternalPlayer(stream.url, title)} className="w-full py-2.5 px-4 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold text-xs flex items-center justify-center gap-2 border border-orange-500/30 transition-all">
                <ExternalLink className="w-4 h-4" /><span>Open in VLC / External Player</span>
              </button>
              {onSwitchToEmbed && (
                <button onClick={onSwitchToEmbed} className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-2 transition-all">
                  <Layers className="w-4 h-4 text-indigo-400" /><span>Switch to Free Mirrors</span>
                </button>
              )}
              <button onClick={() => { navigator.clipboard.writeText(stream.url); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2500); }} className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[11px] font-medium transition-all flex items-center justify-center gap-1.5">
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Unavailable */}
      {isCopyrightNoticeOpen && (
        <div className="absolute inset-0 z-50 bg-black/92 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="max-w-md w-full bg-[#0e101a] border border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-white mb-1.5">Stream Unavailable</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-5">This stream has been removed. Try another option or use our free mirrors.</p>
            <div className="w-full space-y-2.5">
              {allStreams.length > 1 && onSelectStream && (
                <button onClick={handleSwitchToNextStream} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Play className="w-4 h-4 fill-black" /><span>Try Next Option</span>
                </button>
              )}
              {onSwitchToEmbed && (
                <button onClick={() => { setIsCopyrightNoticeOpen(false); onSwitchToEmbed(); }} className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold text-xs border border-indigo-500/40 flex items-center justify-center gap-2 transition-all">
                  <Layers className="w-4 h-4 text-indigo-400" /><span>Switch to Free Mirrors</span>
                </button>
              )}
              {onOpenStreamSelector && allStreams.length > 1 && (
                <button onClick={() => { setIsCopyrightNoticeOpen(false); onOpenStreamSelector(); }} className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 flex items-center justify-center gap-2 transition-all">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /><span>Browse All Options</span>
                </button>
              )}
              <button onClick={() => setIsCopyrightNoticeOpen(false)} className="w-full py-2 text-gray-400 hover:text-white text-xs font-medium transition-colors">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Centre feedback */}
      {playStateFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="p-6 rounded-full bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-2xl animate-ping opacity-75">
            {playStateFeedback === 'play' ? <Play className="w-12 h-12 fill-white" /> : <Pause className="w-12 h-12 fill-white" />}
          </div>
        </div>
      )}

      {/* Skip feedback */}
      {seekFeedback && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-40 pointer-events-none ${seekFeedback === 'forward' ? 'right-12' : 'left-12'}`}>
          <div className="px-5 py-3 rounded-2xl bg-black/85 border border-white/20 text-white flex items-center gap-2 backdrop-blur-lg shadow-2xl">
            {seekFeedback === 'forward'
              ? <><span className="text-base font-black">+10s</span><RotateCw className="w-5 h-5 text-white/60" /></>
              : <><RotateCcw className="w-5 h-5 text-white/60" /><span className="text-base font-black">-10s</span></>
            }
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 pt-4 pb-10 bg-gradient-to-b from-black/85 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 shrink-0" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm sm:text-base truncate leading-tight">{title}</p>
            {isTV && <p className="text-white/50 text-xs truncate">S{season} · E{episode}{episodeName ? ` · ${episodeName}` : ''}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-white/10 text-white/50 text-[10px] font-bold uppercase tracking-wider border border-white/10">
            {stream.quality === '4K Ultra HD' ? '4K UHD' : stream.quality === '1080p Ultra' ? '1080p' : 'HD'}
          </span>
          {onOpenStreamSelector && allStreams.length > 0 && (
            <button onClick={onOpenStreamSelector} className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all">
              <Sparkles className="w-3.5 h-3.5" /><span>{allStreams.length} Options</span>
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-red-600 text-white border border-white/15 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM OSD */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-12 bg-gradient-to-t from-black/85 to-transparent flex flex-col gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Scrub bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/50 shrink-0 w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div
            className="relative flex-1 h-1 bg-white/20 rounded-full group cursor-pointer"
            onClick={e => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
              if (videoRef.current && duration > 0) { const t = ratio * duration; videoRef.current.currentTime = t; setCurrentTime(t); }
            }}
          >
            <div className="absolute inset-y-0 left-0 bg-white/25 rounded-full" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100" style={{ width: `${progressPercent}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progressPercent}% - 6px)` }} />
          </div>
          <span className="text-xs font-mono text-white/35 shrink-0 w-10 tabular-nums">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <button onClick={() => seekBy(-10)} className="p-2.5 rounded-xl hover:bg-white/10 text-white transition-all"><RotateCcw className="w-5 h-5" /></button>
            <button onClick={togglePlay} className="p-3 mx-1 rounded-full bg-white text-black shadow-lg transition-all active:scale-95 hover:scale-105">
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
            </button>
            <button onClick={() => seekBy(10)} className="p-2.5 rounded-xl hover:bg-white/10 text-white transition-all"><RotateCw className="w-5 h-5" /></button>
            {isTV && (
              <>
                <button onClick={onPrevEpisode} disabled={!hasPrevEpisode} className="p-2 ml-1 rounded-xl hover:bg-white/10 disabled:opacity-25 text-white transition-all"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={onNextEpisode} disabled={!hasNextEpisode} className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-25 text-white transition-all"><ChevronRight className="w-5 h-5" /></button>
              </>
            )}
            <button onClick={cycleSpeed} className="ml-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white font-mono text-xs font-bold border border-white/10 transition-all">{playbackSpeed}×</button>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="flex items-center">
              <button onClick={handleToggleMute} onMouseEnter={showVolumePanel} className="p-2.5 rounded-xl hover:bg-white/10 text-white transition-all">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className={`flex items-center overflow-hidden transition-all duration-300 ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`} onMouseEnter={showVolumePanel}>
                <input type="range" min={0} max={1} step={0.02} value={isMuted ? 0 : volume} onChange={e => handleVolumeChange(parseFloat(e.target.value))} className="w-full h-1 accent-white cursor-pointer" />
              </div>
            </div>
            <button onClick={handleToggleFullscreen} className="p-2.5 rounded-xl hover:bg-white/10 text-white transition-all">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <WatchPartyReactions onOpenPartyModal={onOpenPartyModal || (() => {})} showBar={showControls} />
    </div>
  );
};
