import React, { useState, useEffect, useRef } from 'react';
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
  QrCode,
  Smartphone,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { ACCENT_COLORS, SUBTITLE_LANGUAGES } from '../services/streaming';
import {
  validateRealDebridToken,
  startDebridDeviceAuth,
  pollDebridDeviceCredentials,
  exchangeDebridToken,
  type RealDebridAccountInfo,
  type RealDebridDeviceCodeResponse,
} from '../services/stremioResolver';

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

  // Device Code Flow State
  const [isDeviceAuthActive, setIsDeviceAuthActive] = useState(false);
  const [deviceAuthData, setDeviceAuthData] = useState<RealDebridDeviceCodeResponse | null>(null);
  const [isPollingDevice, setIsPollingDevice] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-validate current key on modal open
  useEffect(() => {
    if (isOpen && realDebridKey.trim() && !rdStatus) {
      validateRealDebridToken(realDebridKey)
        .then(info => setRdStatus(info))
        .catch(() => {});
    }
  }, [isOpen, realDebridKey, rdStatus]);

  // Clean up device poll timer on unmount or close
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

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

  const handleStartDeviceAuth = async () => {
    setIsDeviceAuthActive(true);
    setIsPollingDevice(true);
    try {
      const data = await startDebridDeviceAuth();
      setDeviceAuthData(data);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const creds = await pollDebridDeviceCredentials(data.device_code);
          if (creds) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsPollingDevice(false);
            const token = await exchangeDebridToken(creds.client_id, creds.client_secret, data.device_code);
            if (token) {
              onSaveRealDebridKey?.(token);
              setIsDeviceAuthActive(false);
              const info = await validateRealDebridToken(token);
              setRdStatus(info);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, (data.interval || 5) * 1000);
    } catch {
      setIsPollingDevice(false);
      setIsDeviceAuthActive(false);
    }
  };

  const handleClearDebrid = () => {
    onSaveRealDebridKey?.('');
    setRdStatus(null);
    setIsDeviceAuthActive(false);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
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
              Customize 4K streams, subtitle languages, accent colors, and Real-Debrid.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Stremio & Real-Debrid 4K Remux Engine */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Real-Debrid 4K Remux Engine
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isRemuxEngineActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}
              >
                {isRemuxEngineActive ? '4K Debrid: Active' : 'Default Free Mode'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              Unlocks uncompressed <strong>50–80 Mbps 4K Blu-ray Remuxes</strong> and Dolby Atmos audio directly inside Lumia's player. Leave blank to use instant free mirrors.
            </p>

            {/* Real-Debrid Authentication Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>Real-Debrid Account</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartDeviceAuth}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Pair with Phone / QR</span>
                  </button>
                  <a
                    href="https://real-debrid.com/apitoken"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-gray-400 hover:text-gray-200 flex items-center gap-0.5"
                  >
                    <span>Get Token</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Device Code Pairing View */}
              {isDeviceAuthActive && deviceAuthData && (
                <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/40 mb-3 animate-in fade-in">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-indigo-400" />
                        <span>Authorize on Real-Debrid</span>
                      </span>
                      <p className="text-[11px] text-gray-300 mt-1">
                        1. Visit <strong className="text-indigo-300">real-debrid.com/device</strong> on any phone or PC
                        <br />
                        2. Enter code: <strong className="text-amber-300 text-sm font-mono tracking-wider ml-1">{deviceAuthData.user_code}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeviceAuthActive(false);
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QR Code */}
                  <div className="flex items-center justify-center py-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&bgcolor=000000&color=ffffff&margin=8&data=${encodeURIComponent(
                        deviceAuthData.direct_verification_url || deviceAuthData.verification_url
                      )}`}
                      alt="Scan to authorize Real-Debrid"
                      className="w-32 h-32 rounded-xl border border-white/20 shadow-lg"
                    />
                  </div>

                  {isPollingDevice && (
                    <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 mt-2">
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                      <span>Waiting for your authorization...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Manual API Key Input */}
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
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all shrink-0"
                >
                  {isValidatingRd ? 'Testing...' : 'Verify'}
                </button>
                {realDebridKey && (
                  <button
                    type="button"
                    onClick={handleClearDebrid}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-950/40 text-gray-400 hover:text-red-400 border border-white/10 transition-all shrink-0"
                    title="Clear Token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Account Status Card */}
              {rdStatus && (
                <div
                  className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                    rdStatus.valid
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-950/40 text-red-300 border-red-500/30'
                  }`}
                >
                  {rdStatus.valid ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white">{rdStatus.username}</span>
                        <span className="text-emerald-400 ml-1.5">
                          ({rdStatus.type?.toUpperCase()} • {rdStatus.premiumDaysRemaining} days premium)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{rdStatus.error || 'Invalid token'}</span>
                    </div>
                  )}
                  {rdStatus.valid && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300">
                      Active
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stremio Addon URL */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 flex items-center justify-between mb-1">
                <span>Custom Stremio Addon Manifest URL (Optional)</span>
                <span className="text-[10px] text-gray-500">Torrentio / Comet / MediaFusion</span>
              </label>
              <input
                type="text"
                value={stremioAddonUrl}
                onChange={e => onSaveStremioAddonUrl?.(e.target.value)}
                placeholder="Auto-configured with Real-Debrid if left blank"
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
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: `#${color.hex}` }}
                    />
                    <span className="truncate">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom TMDB API Key */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Custom TMDB API Key (Optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              If TMDB is ever rate-limited, provide your personal v3 API read token here.
            </p>
            <input
              type="password"
              value={tmdbApiKey}
              onChange={e => onSaveTmdbApiKey(e.target.value)}
              placeholder="Leave empty to use built-in key..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
