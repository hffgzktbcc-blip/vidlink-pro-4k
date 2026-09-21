import React, { useState } from 'react';
import {
  X,
  Palette,
  Key,
  Zap,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ACCENT_COLORS, SUBTITLE_LANGUAGES } from '../services/streaming';
import { validateRealDebridToken, type RealDebridAccountInfo } from '../services/stremioResolver';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  onSelectAccentColor: (color: string) => void;
  subLang: string;
  onSelectSubLang: (lang: string) => void;
  tmdbApiKey: string;
  onSaveTmdbApiKey: (key: string) => void;
  stremioAddonUrl?: string;
  onSaveStremioAddonUrl?: (url: string) => void;
  realDebridKey?: string;
  onSaveRealDebridKey?: (key: string) => void;
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
  stremioAddonUrl = '',
  onSaveStremioAddonUrl,
  realDebridKey = '',
  onSaveRealDebridKey,
}) => {
  const [isValidatingRd, setIsValidatingRd] = useState(false);
  const [rdStatus, setRdStatus] = useState<RealDebridAccountInfo | null>(null);

  if (!isOpen) return null;

  const handleTestDebrid = async () => {
    if (!realDebridKey.trim()) return;
    setIsValidatingRd(true);
    setRdStatus(null);
    try {
      const info = await validateRealDebridToken(realDebridKey);
      setRdStatus(info);
    } catch {
      setRdStatus({ valid: false, error: 'Connection check failed' });
    } finally {
      setIsValidatingRd(false);
    }
  };

  const isRemuxEngineActive = Boolean(stremioAddonUrl.trim() || realDebridKey.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e101a] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
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
              Customize 4K streams, subtitle languages, accent colors, and API connections.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Stremio & Real-Debrid 4K Remux Engine (Stremio Competitor Suite) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  4K Remux & Debrid Engine
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isRemuxEngineActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}
              >
                {isRemuxEngineActive ? '4K Remux: Active' : 'Default Free Mode'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              Unlocks uncompressed <strong>50–80 Mbps 4K Blu-ray Remuxes</strong> and Dolby Atmos audio directly inside Lumia's native player with 0 buffering. Leave blank to use instant free mirrors.
            </p>

            {/* Real-Debrid API Key */}
            <div className="mb-3">
              <label className="text-[11px] font-semibold text-gray-300 flex items-center justify-between mb-1">
                <span>Real-Debrid API Token (Optional)</span>
                <a
                  href="https://real-debrid.com/apitoken"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                >
                  <span>Get Token</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={realDebridKey}
                  onChange={e => onSaveRealDebridKey?.(e.target.value)}
                  placeholder="Paste Real-Debrid API token..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleTestDebrid}
                  disabled={!realDebridKey.trim() || isValidatingRd}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-xs font-bold text-gray-200 transition-all shrink-0"
                >
                  {isValidatingRd ? 'Testing...' : 'Verify'}
                </button>
              </div>

              {rdStatus && (
                <div
                  className={`mt-2 p-2 rounded-xl text-xs flex items-center gap-2 border ${
                    rdStatus.valid
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-950/40 text-red-300 border-red-500/30'
                  }`}
                >
                  {rdStatus.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Verified: <strong>{rdStatus.username}</strong> ({rdStatus.premiumDaysRemaining} days premium left)
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{rdStatus.error || 'Invalid token'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stremio Addon URL */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 flex items-center justify-between mb-1">
                <span>Custom Stremio Addon Manifest URL</span>
                <span className="text-[10px] text-gray-500">Torrentio / Comet / MediaFusion</span>
              </label>
              <input
                type="text"
                value={stremioAddonUrl}
                onChange={e => onSaveStremioAddonUrl?.(e.target.value)}
                placeholder="https://torrentio.strem.fun/.../manifest.json"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

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
              Lumia 4K comes with pre-configured high-speed fallback catalogs. You can optionally supply your own TMDB v3 API Key for unlimited direct rate limits.
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
