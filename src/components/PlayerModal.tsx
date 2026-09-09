import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Tv,
  Film,
  Server,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sun,
  Share2,
  Check,
  CheckCircle2,
  Sparkles,
  Activity,
  Maximize2,
  Minimize2,
  MousePointer2,
  Play,
} from 'lucide-react';
import type { MediaItem, MediaType, Season } from '../types';
import { STREAM_SERVERS, measureServerLatency } from '../services/streaming';
import { fetchSeasonDetails } from '../services/tmdb';
import { VirtualCursor } from './VirtualCursor';

interface PlayerModalProps {
  media: MediaItem | null;
  initialSeason?: number;
  initialEpisode?: number;
  onClose: () => void;
  accentColor?: string;
  subLang?: string;
  onRecordProgress?: (item: any) => void;
}

const WATCHED_EPISODES_KEY = 'vidlink_watched_episodes_v1';

export const PlayerModal: React.FC<PlayerModalProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
  onClose,
  accentColor = '6366f1',
  subLang = 'en',
  onRecordProgress,
}) => {
  const [currentServer, setCurrentServer] = useState(STREAM_SERVERS[0]);
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [isLoadingSeason, setIsLoadingSeason] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const isTvModeInitial = typeof window !== 'undefined' && (
    document.body.classList.contains('tv-mode') || localStorage.getItem('vidlink_tv_mode') === 'true'
  );
  // Default to True Fullscreen Cinema mode and Virtual Cursor on TV
  const [isTrueFullscreen, setIsTrueFullscreen] = useState(true);
  const [isCursorActive, setIsCursorActive] = useState(isTvModeInitial);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Automatically focus video iframe on load so TV remote / Enter keys can trigger playback directly
  useEffect(() => {
    const timer = setTimeout(() => {
      iframeRef.current?.focus();
    }, 800);
    return () => clearTimeout(timer);
  }, [playerKey, currentServer, season, episode]);

  const triggerControlsActivity = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

  useEffect(() => {
    triggerControlsActivity();
    const onActivity = () => triggerControlsActivity();
    window.addEventListener('keydown', onActivity);
    window.addEventListener('mousemove', onActivity);
    return () => {
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('mousemove', onActivity);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [triggerControlsActivity]);

  // Turn off GPU-heavy Ambilight by default on TV to eliminate sluggishness
  const [isAmbilightOn, setIsAmbilightOn] = useState(!isTvModeInitial);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [serverLatencies, setServerLatencies] = useState<Record<string, number>>({});
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHED_EPISODES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isTV = media?.media_type === 'tv' || (!media?.title && !!media?.name);
  const mediaType: MediaType = isTV ? 'tv' : 'movie';
  const title = media?.title || media?.name || 'Now Playing';

  // Load season episodes if TV show
  useEffect(() => {
    if (media && isTV) {
      let isMounted = true;
      setIsLoadingSeason(true);
      fetchSeasonDetails(media.id, season)
        .then(data => {
          if (isMounted && data) {
            setSeasonData(data);
          }
        })
        .catch(console.error)
        .finally(() => {
          if (isMounted) setIsLoadingSeason(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [media, season, isTV]);

  // Record watch history & mark current episode as watched
  useEffect(() => {
    if (media && onRecordProgress) {
      onRecordProgress({
        id: media.id,
        mediaType,
        title,
        posterPath: media.poster_path,
        backdropPath: media.backdrop_path,
        season: isTV ? season : undefined,
        episode: isTV ? episode : undefined,
      });

      if (isTV) {
        const epKey = `${media.id}-s${season}-e${episode}`;
        setWatchedEpisodes(prev => {
          if (!prev.includes(epKey)) {
            const next = [...prev, epKey];
            try {
              localStorage.setItem(WATCHED_EPISODES_KEY, JSON.stringify(next));
            } catch (e) {
              console.error(e);
            }
            return next;
          }
          return prev;
        });
      }
    }
  }, [media, season, episode, mediaType, title, isTV]);

  // Initial Server Ping Benchmark
  const runServerBenchmark = async () => {
    setIsBenchmarking(true);
    const results: Record<string, number> = {};
    for (const srv of STREAM_SERVERS) {
      results[srv.id] = await measureServerLatency(srv.id);
    }
    setServerLatencies(results);
    setIsBenchmarking(false);
  };

  useEffect(() => {
    runServerBenchmark();
  }, []);

  // Keyboard Shortcuts (L = Ambilight, S = Server switch, ESC = Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (isTrueFullscreen) {
          setIsTrueFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'f') {
        setIsTrueFullscreen(prev => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        setIsCursorActive(prev => !prev);
      } else if (e.key.toLowerCase() === 'l') {
        setIsAmbilightOn(prev => !prev);
      } else if (e.key.toLowerCase() === 's') {
        // Cycle server
        setCurrentServer(prev => {
          const idx = STREAM_SERVERS.findIndex(s => s.id === prev.id);
          const nextIdx = (idx + 1) % STREAM_SERVERS.length;
          return STREAM_SERVERS[nextIdx];
        });
        setPlayerKey(k => k + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!media) return null;

  const totalSeasons = media.number_of_seasons || 1;
  const currentEpisodesCount = seasonData?.episodes?.length || seasonData?.episode_count || 12;

  const handlePrevEpisode = () => {
    if (episode > 1) {
      setEpisode(episode - 1);
      setPlayerKey(k => k + 1);
    } else if (season > 1) {
      setSeason(season - 1);
      setEpisode(1);
      setPlayerKey(k => k + 1);
    }
  };

  const handleNextEpisode = () => {
    if (episode < currentEpisodesCount) {
      setEpisode(episode + 1);
      setPlayerKey(k => k + 1);
    } else if (season < totalSeasons) {
      setSeason(season + 1);
      setEpisode(1);
      setPlayerKey(k => k + 1);
    }
  };

  // Copy Direct Share Link
  const handleCopyShareLink = () => {
    const origin = window.location.origin;
    const shareUrl = isTV
      ? `${origin}/?watch=tv&id=${media.id}&s=${season}&e=${episode}`
      : `${origin}/?watch=movie&id=${media.id}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2500);
    });
  };

  const streamUrl = currentServer.getUrl(
    media.id,
    mediaType,
    season,
    episode,
    accentColor,
    subLang
  );

  // True Fullscreen Cinema Mode Rendering
  if (isTrueFullscreen) {
    return (
      <div
        data-tv-modal="true"
        className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none"
      >
        {/* Fullscreen Video Iframe */}
        <iframe
          ref={iframeRef}
          key={`${playerKey}-${currentServer.id}-${season}-${episode}`}
          src={streamUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0 z-0 bg-black"
          allow="accelerometer; autoplay *; clipboard-write; encrypted-media *; gyroscope; picture-in-picture *; fullscreen *; web-share"
          allowFullScreen
        />

        {/* Virtual Remote Cursor Layer */}
        <VirtualCursor
          isEnabled={isCursorActive}
          onToggle={() => setIsCursorActive(prev => !prev)}
        />

        {/* Auto-Hiding Top Control Bar */}
        <div
          className={`absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex flex-wrap items-center justify-between gap-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              data-tv-focus="true"
              onClick={() => setIsTrueFullscreen(false)}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all flex items-center gap-2 text-xs font-bold"
              title="Exit Fullscreen to Windowed Mode (F or Esc)"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Windowed</span>
            </button>

            <div className="flex flex-col">
              <h2 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
                {title}
              </h2>
              {isTV && (
                <span className="text-[11px] text-indigo-300 font-semibold">
                  S{season} E{episode} {seasonData?.episodes?.[episode - 1]?.name ? `• ${seasonData.episodes[episode - 1].name}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Quick TV Actions */}
          <div className="flex items-center gap-2">
            {/* Direct Remote Focus button */}
            <button
              data-tv-focus="true"
              onClick={() => iframeRef.current?.focus()}
              className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5 transition-all shadow-md"
              title="Direct TV Remote Focus (Sends OK / Arrow clicks straight into video player)"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Remote Focus</span>
            </button>

            {/* TV Cursor Toggle */}
            <button
              data-tv-focus="true"
              onClick={() => setIsCursorActive(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                isCursorActive
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/40'
                  : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/15'
              }`}
              title="Toggle Remote Cursor Mode (C)"
            >
              <MousePointer2 className="w-4 h-4 text-amber-400" />
              <span>Cursor: {isCursorActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* Server Quick Switcher (Cycle S) */}
            <button
              data-tv-focus="true"
              onClick={() => {
                const idx = STREAM_SERVERS.findIndex(s => s.id === currentServer.id);
                const nextIdx = (idx + 1) % STREAM_SERVERS.length;
                setCurrentServer(STREAM_SERVERS[nextIdx]);
                setPlayerKey(k => k + 1);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-all"
              title="Switch Stream Mirror (S)"
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{currentServer.name}</span>
              <span className="sm:hidden">Server</span>
            </button>

            {/* TV Prev / Next Episode Buttons */}
            {isTV && (
              <div className="flex items-center gap-1">
                <button
                  data-tv-focus="true"
                  onClick={handlePrevEpisode}
                  disabled={season === 1 && episode === 1}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white border border-white/15 transition-all"
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  data-tv-focus="true"
                  onClick={handleNextEpisode}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
                  title="Next Episode"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Reload Stream */}
            <button
              data-tv-focus="true"
              onClick={() => setPlayerKey(k => k + 1)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
              title="Reload Stream"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              data-tv-focus="true"
              onClick={onClose}
              className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-all shadow-lg"
              title="Close Player (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Helper Hint (Auto-fading) */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-[11px] text-gray-300 transition-opacity duration-500 pointer-events-none flex items-center gap-4 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span>🎯 <b>Remote D-Pad</b> moves cursor • <b>OK</b> clicks Play/Controls</span>
          <span>•</span>
          <span>Press <b>C</b> for Cursor • <b>F</b> for Windowed</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tv-modal="true"
      className={`fixed inset-0 z-50 overflow-y-auto backdrop-blur-2xl flex flex-col items-center justify-start transition-all duration-500 ${
        isLightsOff ? 'bg-black' : 'bg-black/95'
      }`}
    >
      <VirtualCursor
        isEnabled={isCursorActive}
        onToggle={() => setIsCursorActive(prev => !prev)}
      />

      {/* Top Header Bar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            {isTV ? <Tv className="w-5 h-5" /> : <Film className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {title}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-gradient-to-r from-amber-500 to-orange-500 text-black shrink-0">
                4K UHD
              </span>
            </div>
            {isTV && (
              <p className="text-xs text-indigo-300 font-medium">
                Season {season} • Episode {episode}
                {seasonData?.episodes?.[episode - 1]?.name ? `: ${seasonData.episodes[episode - 1].name}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {/* True Fullscreen Toggle */}
          <button
            data-tv-focus="true"
            onClick={() => setIsTrueFullscreen(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 border border-indigo-400 transition-all"
            title="Expand to Fullscreen Cinema Mode (F)"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Cinema Mode</span>
          </button>

          {/* Virtual Cursor Toggle */}
          <button
            data-tv-focus="true"
            onClick={() => setIsCursorActive(prev => !prev)}
            className={`p-2.5 rounded-xl border transition-all ${
              isCursorActive
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Toggle TV Virtual Cursor (C)"
          >
            <MousePointer2 className="w-4 h-4 text-amber-400" />
          </button>

          {/* Share Stream Button */}
          <button
            data-tv-focus="true"
            onClick={handleCopyShareLink}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Share Direct Stream Link"
          >
            {isCopiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isCopiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Ambilight Toggle Button */}
          <button
            data-tv-focus="true"
            onClick={() => setIsAmbilightOn(prev => !prev)}
            className={`p-2.5 rounded-xl border transition-all ${
              isAmbilightOn
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Toggle Reactive Ambilight Glow (L)"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Lights Off Cinema Toggle */}
          <button
            data-tv-focus="true"
            onClick={() => setIsLightsOff(prev => !prev)}
            className={`p-2.5 rounded-xl border transition-all ${
              isLightsOff
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Turn Off UI Lights"
          >
            <Sun className="w-4 h-4" />
          </button>

          {/* Reload stream button */}
          <button
            data-tv-focus="true"
            onClick={() => setPlayerKey(k => k + 1)}
            title="Reload Video Stream"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Close modal */}
          <button
            data-tv-focus="true"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 border border-white/10 hover:border-red-500/30 transition-all"
            title="Close Cinema Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Video Screen & Ambilight Frame */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        <div className="relative w-full aspect-video rounded-2xl">
          {/* Ambilight Ambient Glow Effect behind Video Frame */}
          {isAmbilightOn && (
            <div
              className="absolute -inset-4 sm:-inset-6 rounded-3xl opacity-60 blur-3xl pointer-events-none transition-all duration-700 -z-10 animate-pulse"
              style={{
                background: `radial-gradient(circle at center, #${accentColor.replace('#', '')}99 0%, #a855f766 50%, transparent 75%)`,
              }}
            />
          )}

          {/* Video Iframe Container */}
          <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <iframe
              ref={iframeRef}
              key={`${playerKey}-${currentServer.id}-${season}-${episode}`}
              src={streamUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay *; clipboard-write; encrypted-media *; gyroscope; picture-in-picture *; fullscreen *; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Server Switcher & Real-Time Ping Latency Row */}
        {!isLightsOff && (
          <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Stream Mirrors:
              </span>
              <button
                onClick={runServerBenchmark}
                className="ml-2 text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                title="Test all server response speeds"
              >
                <Activity className="w-3 h-3" />
                <span>{isBenchmarking ? 'Testing...' : 'Test Speed'}</span>
              </button>
            </div>

            {/* Server Option Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {STREAM_SERVERS.map(srv => {
                const isActive = srv.id === currentServer.id;
                const ping = serverLatencies[srv.id] || srv.pingMs || 40;
                const pingColor = ping < 45 ? 'text-emerald-400' : ping < 80 ? 'text-amber-400' : 'text-gray-400';

                return (
                  <button
                    key={srv.id}
                    data-tv-focus="true"
                    onClick={() => {
                      setCurrentServer(srv);
                      setPlayerKey(k => k + 1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                    }`}
                  >
                    <span>{srv.name}</span>
                    <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${pingColor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {ping}ms
                    </span>
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-black rounded ${
                        isActive ? 'bg-black/40 text-amber-300' : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {srv.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TV Series Episode Navigator */}
        {isTV && !isLightsOff && (
          <div className="glass-panel p-4 rounded-2xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Season:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {Array.from({ length: totalSeasons }).map((_, idx) => {
                    const sNum = idx + 1;
                    const isSelected = sNum === season;
                    return (
                      <button
                        key={sNum}
                        data-tv-focus="true"
                        onClick={() => {
                          setSeason(sNum);
                          setEpisode(1);
                          setPlayerKey(k => k + 1);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        Season {sNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prev / Next Episode Buttons */}
              <div className="flex items-center gap-2">
                <button
                  data-tv-focus="true"
                  onClick={handlePrevEpisode}
                  disabled={season === 1 && episode === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev Episode</span>
                </button>
                <button
                  data-tv-focus="true"
                  onClick={handleNextEpisode}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-500/20 transition-all"
                >
                  <span>Next Episode</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Episode Grid */}
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between">
                <span>Select Episode (Season {season}):</span>
                {isLoadingSeason && (
                  <span className="text-indigo-400 text-xs animate-pulse">
                    Loading episodes...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {Array.from({ length: currentEpisodesCount }).map((_, idx) => {
                  const epNum = idx + 1;
                  const isCurrent = epNum === episode;
                  const epKey = `${media.id}-s${season}-e${epNum}`;
                  const isWatched = watchedEpisodes.includes(epKey);
                  const epDetail = seasonData?.episodes?.[idx];

                  return (
                    <button
                      key={epNum}
                      data-tv-focus="true"
                      onClick={() => {
                        setEpisode(epNum);
                        setPlayerKey(k => k + 1);
                      }}
                      className={`p-2.5 rounded-xl text-left transition-all border relative ${
                        isCurrent
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-102'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Ep {epNum}</span>
                        {isWatched && !isCurrent && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-300 truncate mt-0.5">
                        {epDetail?.name || `Episode ${epNum}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Streaming Tips & Keybinding Cheatsheet */}
        {!isLightsOff && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Tip: Press <kbd className="px-1.5 py-0.5 bg-black/60 rounded border border-white/10 font-mono text-[10px] text-white">L</kbd> for Ambilight, <kbd className="px-1.5 py-0.5 bg-black/60 rounded border border-white/10 font-mono text-[10px] text-white">S</kbd> to cycle fast servers, <kbd className="px-1.5 py-0.5 bg-black/60 rounded border border-white/10 font-mono text-[10px] text-white">Esc</kbd> to exit.
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 shrink-0">
              VidLink Cinema Engine v4.5
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
