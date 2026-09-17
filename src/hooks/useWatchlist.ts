import { useState, useEffect, useCallback } from 'react';
import type { MediaItem, WatchHistoryItem, MediaType } from '../types';

const WATCHLIST_STORAGE_KEY = 'vidlink_watchlist_v1';
const HISTORY_STORAGE_KEY = 'vidlink_history_v1';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist', e);
    }
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  const isInWatchlist = (id: number) => {
    return watchlist.some(item => item.id === id);
  };

  const toggleWatchlist = (item: MediaItem) => {
    setWatchlist(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [item, ...prev];
      }
    });
  };

  const removeFromWatchlist = (id: number) => {
    setWatchlist(prev => prev.filter(i => i.id !== id));
  };

  const clearWatchlist = () => {
    setWatchlist([]);
  };

  const recordHistory = (item: {
    id: number;
    mediaType: MediaType;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    season?: number;
    episode?: number;
  }) => {
    const newItem: WatchHistoryItem = {
      ...item,
      timestamp: Date.now(),
      progressPercent: 10,
      lastUpdated: new Date().toISOString(),
    };

    setHistory(prev => {
      const filtered = prev.filter(h => !(h.id === item.id && h.mediaType === item.mediaType));
      return [newItem, ...filtered].slice(0, 30);
    });
  };

  const removeFromHistory = (id: number, mediaType: MediaType) => {
    setHistory(prev => prev.filter(h => !(h.id === id && h.mediaType === mediaType)));
  };

  const clearWatchHistory = () => {
    setHistory([]);
  };

  const importSyncData = useCallback((newWatchlist: MediaItem[], newHistory: WatchHistoryItem[]) => {
    setWatchlist(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const additions = newWatchlist.filter(item => !existingIds.has(item.id));
      return [...additions, ...prev].slice(0, 50);
    });
    setHistory(prev => {
      const existingKeys = new Set(prev.map(h => `${h.id}-${h.mediaType}`));
      const additions = newHistory.filter(h => !existingKeys.has(`${h.id}-${h.mediaType}`));
      return [...additions, ...prev].slice(0, 50);
    });
  }, []);

  return {
    watchlist,
    history,
    isInWatchlist,
    toggleWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    recordHistory,
    removeFromHistory,
    clearWatchHistory,
    importSyncData,
  };
};
