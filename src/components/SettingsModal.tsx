import React from 'react';
import {
  X,
  Palette,
  Key,
  Zap,
  Globe,
} from 'lucide-react';
import { ACCENT_COLORS, SUBTITLE_LANGUAGES } from '../services/streaming';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  onSelectAccentColor: (color: string) => void;
  subLang: string;
  onSelectSubLang: (lang: string) => void;
  tmdbApiKey: string;
  onSaveTmdbApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accentColor,
  onSelectAccentColor,
  subLang,
  onSelectSubLang,
  tmdbApiKey,
  onSaveTmdbApiKey,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e101a] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Playback & Theme Settings</h2>
            <p className="text-xs text-gray-400">
              Customize subtitle languages, accent colors, and API connections.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Subtitle Language Preference */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Default Subtitle Language</span>
            </label>
            <select
              value={subLang}
              onChange={e => onSelectSubLang(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {SUBTITLE_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-[#0e101a] text-white">
                  {lang.name} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Accent Color Palette */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Player & UI Theme Accent</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {ACCENT_COLORS.map(color => {
                const isSelected = accentColor.replace('#', '') === color.hex;
                return (
                  <button
                    key={color.hex}
                    onClick={() => onSelectAccentColor(color.hex)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-white bg-white/15 text-white ring-2 ring-indigo-500/50'
                        : 'border-white/10 hover:border-white/20 bg-white/5 text-gray-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow"
                      style={{ backgroundColor: color.display }}
                    />
                    <span className="truncate">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional TMDB API Key */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-1.5">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Custom TMDB API Key (Optional)</span>
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              VidLink Pro comes with pre-configured high-speed fallback catalogs. You can optionally supply your own TMDB v3 API Key for unlimited direct rate limits.
            </p>
            <input
              type="text"
              value={tmdbApiKey}
              onChange={e => onSaveTmdbApiKey(e.target.value)}
              placeholder="Paste TMDB v3 Key (e.g. 1a2b3c4d5e...)"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
