import { useState, useEffect } from 'react';
import type { WatchHistoryItem, MediaType } from '../types';

const HISTORY_STORAGE_KEY = 'vidlink_history_v1';

export const useWatchHistory = () => {
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
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  const recordPlay = (
    item: {
      id: number;
      mediaType: MediaType;
      title: string;
      posterPath: string | null;
      backdropPath: string | null;
      season?: number;
      episode?: number;
    },
    progressPercent = 10
  ) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.id === item.id && h.mediaType === item.mediaType));
      const newItem: WatchHistoryItem = {
        id: item.id,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        season: item.season,
        episode: item.episode,
        timestamp: Date.now(),
        progressPercent,
        lastUpdated: new Date().toISOString(),
      };
      return [newItem, ...filtered].slice(0, 30);
    });
  };

  const removeFromHistory = (id: number, mediaType: MediaType) => {
    setHistory(prev => prev.filter(h => !(h.id === id && h.mediaType === mediaType)));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    recordPlay,
    removeFromHistory,
    clearHistory,
  };
};
