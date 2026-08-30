import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Tv,
  Sparkles,
  Search,
  Bookmark,
  Settings,
  Flame,
  X,
  Compass,
} from 'lucide-react';
import type { ActiveTab, MediaItem } from '../types';
import { searchMedia, getImageUrl } from '../services/tmdb';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onSelectMedia: (item: MediaItem) => void;
  watchlistCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onSelectMedia,
  watchlistCount,
  searchQuery,
  setSearchQuery,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Autocomplete live search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchMedia(searchQuery);
        setSuggestions(results.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Flame },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv', label: 'TV Shows', icon: Tv },
    { id: '4k', label: '4K Ultra HD', icon: Sparkles, badge: '4K' },
    { id: 'universes', label: 'Universes', icon: Compass },
    { id: 'watchlist', label: 'My Watchlist', icon: Bookmark, count: watchlistCount },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#08090f]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => {
            setActiveTab('home');
            setSearchQuery('');
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-300">
            <Film className="w-5 h-5 text-white" />
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-30 blur group-hover:opacity-60 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-xl text-white">
                VidLink <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Pro</span>
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider rounded bg-gradient-to-r from-amber-500 to-orange-500 text-black">
                4K HDR
              </span>
            </div>
            <span className="text-[10px] text-gray-400 tracking-widest uppercase font-medium -mt-1 hidden sm:block">
              Free Cinema Streamer
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !searchQuery;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setSearchQuery('');
                }}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-white/10 shadow-inner'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-indigo-500 text-white">
                    {item.badge}
                  </span>
                )}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                    {item.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Bar & Action Controls */}
        <div className="flex items-center gap-2.5 relative" ref={searchRef}>
          {/* Search Box */}
          <div className="relative flex items-center w-48 sm:w-64 md:w-72">
            <div className="absolute left-3 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search 4K movies, series..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white/5 hover:bg-white/10 focus:bg-[#0e101a] border border-white/10 focus:border-indigo-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
            title="Settings (Subtitles, Themes, API)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && searchQuery.trim().length > 0 && (
            <div className="absolute top-12 right-0 w-80 sm:w-96 bg-[#0e101a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-200">
              <div className="px-4 py-2.5 text-xs font-bold text-gray-400 border-b border-white/10 flex items-center justify-between">
                <span>Direct Search Results</span>
                {isSearching && <span className="text-indigo-400 animate-pulse">Searching...</span>}
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                {suggestions.map(item => {
                  const title = item.title || item.name || 'Untitled';
                  const year = (item.release_date || item.first_air_date || '').substring(0, 4);
                  const isTV = item.media_type === 'tv';

                  return (
                    <div
                      key={`${item.media_type}-${item.id}`}
                      onClick={() => {
                        onSelectMedia(item);
                        setSuggestions([]);
                      }}
                      className="p-3 hover:bg-white/10 flex items-center gap-3 cursor-pointer transition-colors group"
                    >
                      <img
                        src={getImageUrl(item.poster_path, 'w300')}
                        alt={title}
                        className="w-10 h-14 object-cover rounded shadow bg-black/40 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-400 truncate">
                            {title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-white/10 text-gray-300">
                            {isTV ? 'TV' : 'Movie'}
                          </span>
                          {year && <span>{year}</span>}
                          {item.vote_average > 0 && (
                            <span className="text-amber-400 font-bold">
                              ★ {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Submenu */}
      <div className="md:hidden flex items-center justify-around px-2 pt-2.5 border-t border-white/5 mt-2 overflow-x-auto no-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !searchQuery;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as ActiveTab);
                setSearchQuery('');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 ${
                isActive ? 'text-indigo-400 bg-indigo-600/15 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
