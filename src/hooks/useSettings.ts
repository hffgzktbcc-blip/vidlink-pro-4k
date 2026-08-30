import { useState, useEffect } from 'react';
import { ACCENT_COLORS } from '../services/streaming';
import { getStoredApiKey, setStoredApiKey } from '../services/tmdb';

interface UserSettings {
  accentColor: string; // hex
  defaultServerId: string;
  tmdbApiKey: string;
  autoplayNext: boolean;
}

const SETTINGS_KEY = 'vidlink_user_settings_v1';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading settings', e);
    }
    return {
      accentColor: ACCENT_COLORS[0].hex,
      defaultServerId: 'vidlink-pro',
      tmdbApiKey: getStoredApiKey(),
      autoplayNext: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed saving settings', e);
    }
  }, [settings]);

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      if (partial.tmdbApiKey !== undefined) {
        setStoredApiKey(partial.tmdbApiKey);
      }
      return next;
    });
  };

  return {
    settings,
    updateSettings,
  };
};
