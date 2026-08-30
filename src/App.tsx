import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Film,
  Tv,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import type { ActiveTab, MediaItem } from './types';
import {
  fetchTrending,
  fetchPopularMovies,
  fetchPopularTV,
  fetch4KCollection,
  fetchMediaDetails,
  fetchByGenre,
  searchMedia,
} from './services/tmdb';
import { MOODS } from './data/universes';
import { useWatchlist } from './hooks/useWatchlist';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MediaRow } from './components/MediaRow';
import { MediaDetailModal } from './components/MediaDetailModal';
import { TrailerModal } from './components/TrailerModal';
import { PlayerModal } from './components/PlayerModal';
import { WatchlistView } from './components/WatchlistView';
import { UniversesView } from './components/UniversesView';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, type ToastMessage } from './components/Toast';

const ACCENT_STORAGE_KEY = 'vidlink_accent_color_v1';
const SUBLANG_STORAGE_KEY = 'vidlink_sublang_v1';
const TMDB_KEY_STORAGE = 'vidlink_custom_tmdb_key_v1';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodItems, setMoodItems] = useState<MediaItem[]>([]);

  // Content Catalogs
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [popularTV, setPopularTV] = useState<MediaItem[]>([]);
  const [top4KList, setTop4KList] = useState<MediaItem[]>([]);

  // Modals & Player State
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [trailerMedia, setTrailerMedia] = useState<MediaItem | null>(null);
  const [playingMedia, setPlayingMedia] = useState<MediaItem | null>(null);
  const [playerSeason, setPlayerSeason] = useState<number>(1);
  const [playerEpisode, setPlayerEpisode] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast Alerts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, description?: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, description, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Custom Preferences
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem(ACCENT_STORAGE_KEY) || '6366f1';
  });

  const [subLang, setSubLang] = useState<string>(() => {
    return localStorage.getItem(SUBLANG_STORAGE_KEY) || 'en';
  });

  const [tmdbApiKey, setTmdbApiKey] = useState<string>(() => {
    return localStorage.getItem(TMDB_KEY_STORAGE) || '';
  });

  const {
    watchlist,
    history,
    toggleWatchlist,
    isInWatchlist,
    recordHistory,
    removeFromWatchlist,
    removeFromHistory,
    clearWatchHistory,
  } = useWatchlist();

  // Load Catalogs on Mount
  useEffect(() => {
    fetchTrending('movie', 'week').then(data => setTrendingMovies(data));
    fetchTrending('tv', 'week').then(data => setTrendingTV(data));
    fetchPopularMovies().then(data => setPopularMovies(data));
    fetchPopularTV().then(data => setPopularTV(data));
    fetch4KCollection().then(data => setTop4KList(data));
  }, []);

  // Mood filter query
  useEffect(() => {
    if (selectedMood) {
      const moodObj = MOODS.find(m => m.id === selectedMood);
      if (moodObj) {
        fetchByGenre(moodObj.genreId).then(data => setMoodItems(data));
      }
    } else {
      setMoodItems([]);
    }
  }, [selectedMood]);

  // Deep-Link URL Router (?watch=movie&id=693134 or ?watch=tv&id=94605&s=2&e=3)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const watchType = params.get('watch');
    const mediaId = params.get('id');
    const s = params.get('s');
    const e = params.get('e');

    if (watchType && mediaId) {
      const numId = Number(mediaId);
      const isTV = watchType === 'tv';
      if (s) setPlayerSeason(Number(s));
      if (e) setPlayerEpisode(Number(e));

      fetchMediaDetails(isTV ? 'tv' : 'movie', numId)
        .then(item => {
          if (item) setPlayingMedia(item);
        })
        .catch(console.error);
    }
  }, []);

  // Handle Search Query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchMedia(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectAccentColor = (hex: string) => {
    setAccentColor(hex);
    localStorage.setItem(ACCENT_STORAGE_KEY, hex);
    addToast('Theme Updated', 'Accent color applied successfully.', 'info');
  };

  const handleSelectSubLang = (lang: string) => {
    setSubLang(lang);
    localStorage.setItem(SUBLANG_STORAGE_KEY, lang);
    addToast('Subtitles Configured', `Default subtitles set to ${lang.toUpperCase()}.`, 'info');
  };

  const handleSaveTmdbKey = (key: string) => {
    setTmdbApiKey(key);
    localStorage.setItem(TMDB_KEY_STORAGE, key);
    addToast('API Key Saved', 'Custom TMDB configuration saved.', 'success');
  };

  const handleToggleWatchlistWithToast = (item: MediaItem) => {
    const isSaved = isInWatchlist(item.id);
    toggleWatchlist(item);
    if (!isSaved) {
      addToast('Added to Watchlist', item.title || item.name || 'Saved to your list');
    } else {
      addToast('Removed from Watchlist', item.title || item.name || 'Removed from your list', 'info');
    }
  };

  const handleStartPlaying = (item: MediaItem, season = 1, episode = 1) => {
    setPlayingMedia(item);
    setPlayerSeason(season);
    setPlayerEpisode(episode);
  };

  // Hero Featured list
  const heroItems = trendingMovies.length ? trendingMovies.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-[#07080d] text-gray-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectMedia={setSelectedMedia}
        watchlistCount={watchlist.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Search Results Mode */}
        {searchQuery.trim() ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Search Results for "{searchQuery}"
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mb-8">
              {isSearching ? 'Searching streaming database...' : `Found ${searchResults.length} titles in 4K & 1080p`}
            </p>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {searchResults.map(item => (
                  <MediaRow
                    key={`${item.media_type}-${item.id}`}
                    title=""
                    items={[item]}
                    onSelectMedia={setSelectedMedia}
                    onPlayMedia={handleStartPlaying}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={handleToggleWatchlistWithToast}
                  />
                ))}
              </div>
            ) : (
              !isSearching && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 p-8">
                  <p className="text-lg font-bold text-white">No titles found for "{searchQuery}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try another movie, actor, director, or series name.</p>
                </div>
              )
            )}
          </div>
        ) : activeTab === 'universes' ? (
          /* Universe Franchises Tab */
          <UniversesView
            onSelectMedia={setSelectedMedia}
            onPlayMedia={handleStartPlaying}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={handleToggleWatchlistWithToast}
          />
        ) : activeTab === 'watchlist' ? (
          /* Watchlist Tab */
          <WatchlistView
            watchlist={watchlist}
            history={history}
            onSelectMedia={setSelectedMedia}
            onPlayMedia={handleStartPlaying}
            onRemoveFromWatchlist={id => {
              removeFromWatchlist(id);
              addToast('Removed from Watchlist', 'Title removed from your saved list.', 'info');
            }}
            onRemoveFromHistory={removeFromHistory}
            onClearHistory={() => {
              clearWatchHistory();
              addToast('Watch History Cleared', 'All streaming history removed.', 'info');
            }}
            onExplore={() => setActiveTab('home')}
          />
        ) : activeTab === 'movies' ? (
          /* Movies Tab */
          <div className="pt-20 space-y-4">
            <HeroBanner
              items={trendingMovies.slice(0, 4)}
              onSelectMedia={setSelectedMedia}
              onPlayMedia={handleStartPlaying}
              onOpenTrailer={item => setTrailerMedia(item)}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={handleToggleWatchlistWithToast}
            />
            <div className="space-y-6 py-6">
              <MediaRow
                title="Trending 4K Blockbusters"
                items={trendingMovies}
                icon={Flame}
                badge="4K HDR"
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />
              <MediaRow
                title="Popular Movies"
                items={popularMovies}
                icon={Film}
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />
            </div>
          </div>
        ) : activeTab === 'tv' ? (
          /* TV Shows Tab */
          <div className="pt-20 space-y-4">
            <HeroBanner
              items={trendingTV.slice(0, 4)}
              onSelectMedia={setSelectedMedia}
              onPlayMedia={handleStartPlaying}
              onOpenTrailer={item => setTrailerMedia(item)}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={handleToggleWatchlistWithToast}
            />
            <div className="space-y-6 py-6">
              <MediaRow
                title="Trending TV Series"
                items={trendingTV}
                icon={Tv}
                badge="All Seasons"
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />
              <MediaRow
                title="Popular Series"
                items={popularTV}
                icon={Star}
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />
            </div>
          </div>
        ) : activeTab === '4k' ? (
          /* 4K Ultra HD Tab */
          <div className="pt-20 space-y-4">
            <HeroBanner
              items={top4KList.slice(0, 4)}
              onSelectMedia={setSelectedMedia}
              onPlayMedia={handleStartPlaying}
              onOpenTrailer={item => setTrailerMedia(item)}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={handleToggleWatchlistWithToast}
            />
            <div className="space-y-6 py-6">
              <MediaRow
                title="4K Ultra HD Cinema Showcase"
                items={top4KList}
                icon={Sparkles}
                badge="2160p 4K"
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />
            </div>
          </div>
        ) : (
          /* Home Tab */
          <>
            <HeroBanner
              items={heroItems}
              onSelectMedia={setSelectedMedia}
              onPlayMedia={handleStartPlaying}
              onOpenTrailer={item => setTrailerMedia(item)}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={handleToggleWatchlistWithToast}
            />

            {/* Mood / Vibe Filter Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-6">
              <div className="glass-panel p-3 rounded-2xl flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2 shrink-0">
                  Mood:
                </span>
                <button
                  onClick={() => setSelectedMood(null)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedMood === null
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  All Vibes
                </button>
                {MOODS.map(mood => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      selectedMood === mood.id
                        ? 'bg-indigo-600 text-white font-bold shadow'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {mood.name}
                  </button>
                ))}
              </div>
            </div>

            {/* If mood filter active, show mood row */}
            {selectedMood && moodItems.length > 0 && (
              <div className="space-y-4 py-2">
                <MediaRow
                  title={`Curated Vibe: ${MOODS.find(m => m.id === selectedMood)?.name}`}
                  items={moodItems}
                  icon={Zap}
                  badge="Curated"
                  onSelectMedia={setSelectedMedia}
                  onPlayMedia={handleStartPlaying}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={handleToggleWatchlistWithToast}
                />
              </div>
            )}

            <div className="space-y-4 py-4">
              {/* Trending 4K Movies */}
              <MediaRow
                title="Trending Movies in 4K"
                items={trendingMovies}
                icon={Flame}
                badge="4K HDR"
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />

              {/* Trending TV Series */}
              <MediaRow
                title="Trending TV Series & Binge Shows"
                items={trendingTV}
                icon={Tv}
                badge="All Seasons"
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />

              {/* Top Rated Masterpieces */}
              <MediaRow
                title="All-Time 4K Masterpieces"
                items={top4KList}
                icon={Star}
                badge="IMDb 8.0+"
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />

              {/* Popular Movies */}
              <MediaRow
                title="Popular Worldwide"
                items={popularMovies}
                icon={Film}
                onSelectMedia={setSelectedMedia}
                onPlayMedia={handleStartPlaying}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleToggleWatchlistWithToast}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#05060a] py-12 mt-16 text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">
                VidLink <span className="text-indigo-400">Pro</span>
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ULTRA 4K
              </span>
            </div>
            <p className="text-gray-400 text-center md:text-left max-w-sm">
              Free streaming cinema platform. Multi-server streams with 4K UHD playback.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab('home')} className="hover:text-white transition-colors">
              Home
            </button>
            <button onClick={() => setActiveTab('movies')} className="hover:text-white transition-colors">
              Movies
            </button>
            <button onClick={() => setActiveTab('tv')} className="hover:text-white transition-colors">
              TV Shows
            </button>
            <button onClick={() => setActiveTab('universes')} className="hover:text-white transition-colors">
              Universes
            </button>
            <button onClick={() => setActiveTab('watchlist')} className="hover:text-white transition-colors">
              Watchlist
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-white transition-colors">
              Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <MediaDetailModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onPlay={handleStartPlaying}
          onOpenTrailer={item => setTrailerMedia(item)}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={handleToggleWatchlistWithToast}
        />
      )}

      {/* Trailer Modal */}
      {trailerMedia && (
        <TrailerModal
          media={trailerMedia}
          onClose={() => setTrailerMedia(null)}
        />
      )}

      {/* Player Modal with Ambilight & Server Ping */}
      {playingMedia && (
        <PlayerModal
          media={playingMedia}
          initialSeason={playerSeason}
          initialEpisode={playerEpisode}
          onClose={() => setPlayingMedia(null)}
          accentColor={accentColor}
          subLang={subLang}
          onRecordProgress={recordHistory}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accentColor={accentColor}
        onSelectAccentColor={handleSelectAccentColor}
        subLang={subLang}
        onSelectSubLang={handleSelectSubLang}
        tmdbApiKey={tmdbApiKey}
        onSaveTmdbApiKey={handleSaveTmdbKey}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
