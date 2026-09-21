import React, { useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Tv,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { MediaItem, WatchHistoryItem } from '../types';
import { playSelectSound } from '../services/soundEffects';
import { generateTvPairingPin, redeemTvPairingPin, type PairingResult } from '../services/pairingService';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: MediaItem[];
  history: WatchHistoryItem[];
  onImportData: (watchlist: MediaItem[], history: WatchHistoryItem[]) => void;
}

export function decodeSyncPayload(rawEncoded: string): { watchlist: MediaItem[]; history: WatchHistoryItem[] } | null {
  try {
    let raw = rawEncoded.trim();
    if (raw.includes('sync=')) {
      raw = raw.split('sync=')[1];
    }
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json);
    return {
      watchlist: parsed.w || [],
      history: parsed.h || [],
    };
  } catch {
    return null;
  }
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  history,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'tv-pin' | 'qr' | 'import'>('tv-pin');
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // 6-Digit TV Pairing State
  const [generatedPin, setGeneratedPin] = useState<PairingResult | null>(null);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [isRedeemingPin, setIsRedeemingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePin = async () => {
    setIsGeneratingPin(true);
    setPinError(null);
    try {
      const result = await generateTvPairingPin(watchlist, history);
      if (result) {
        setGeneratedPin(result);
        playSelectSound();
      } else {
        setPinError('Failed to generate PIN. Try QR code.');
      }
    } catch {
      setPinError('Connection error. Try QR code.');
    } finally {
      setIsGeneratingPin(false);
    }
  };

  const handleRedeemPin = async () => {
    const clean = enteredPin.replace(/\D/g, '');
    if (clean.length !== 6) {
      setPinError('Please enter all 6 digits');
      return;
    }

    setIsRedeemingPin(true);
    setPinError(null);
    try {
      const data = await redeemTvPairingPin(clean);
      if (data && (data.watchlist.length > 0 || data.history.length > 0)) {
        onImportData(data.watchlist, data.history);
        setImportSuccess(true);
        playSelectSound();
        setTimeout(() => {
          setImportSuccess(false);
          onClose();
        }, 1200);
      } else {
        setPinError('PIN expired or invalid. Please generate a new code.');
      }
    } catch {
      setPinError('Could not connect to pairing server.');
    } finally {
      setIsRedeemingPin(false);
    }
  };

  // Compress essential data into a portable payload
  const syncPayload = {
    w: watchlist.slice(0, 30).map(item => ({
      id: item.id,
      title: item.title || item.name,
      media_type: item.media_type,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
    })),
    h: history.slice(0, 20).map(entry => ({
      id: entry.id,
      mediaType: entry.mediaType,
      title: entry.title,
      posterPath: entry.posterPath,
      backdropPath: entry.backdropPath,
      season: entry.season,
      episode: entry.episode,
      timestamp: entry.timestamp,
      progressPercent: entry.progressPercent,
      lastUpdated: entry.lastUpdated,
    })),
  };

  const encodedString = typeof window !== 'undefined'
    ? btoa(unescape(encodeURIComponent(JSON.stringify(syncPayload))))
    : '';

  const syncUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?sync=${encodedString}`
    : '';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(syncUrl);
      setCopied(true);
      playSelectSound();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleImport = () => {
    const decoded = decodeSyncPayload(importCode);
    if (decoded && (decoded.watchlist.length > 0 || decoded.history.length > 0)) {
      onImportData(decoded.watchlist, decoded.history);
      setImportSuccess(true);
      playSelectSound();
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1200);
    } else {
      alert('Invalid Sync Code or URL. Please verify and try again.');
    }
  };

  // Generate dynamic QR code representation
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    syncUrl
  )}&bgcolor=0b0d17&color=ffffff&margin=1`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-[#0e101a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Instant TV & Device Sync</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                Cloudflare Edge
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Sync watchlist & resume progress between Android TV, Phone, and PC.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
          <button
            onClick={() => setActiveTab('tv-pin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'tv-pin' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>6-Digit TV PIN</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct Code</span>
          </button>
        </div>

        {/* 6-Digit TV PIN Tab (Stremio Killer Flagship) */}
        {activeTab === 'tv-pin' && (
          <div className="space-y-5">
            {/* Section 1: Generate Code to send TO another device */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-black border border-indigo-500/30 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Step A: Push Data to Your TV
              </span>
              <p className="text-[11px] text-gray-400">
                Generate a temporary 6-digit code on this device, then type it on your TV or tablet to sync immediately.
              </p>

              {generatedPin ? (
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/60 border border-white/10">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Your Pairing PIN (Valid 10 mins):</span>
                  <div className="text-3xl font-black font-mono tracking-widest text-emerald-400">
                    {generatedPin.formattedPin}
                  </div>
                  <span className="text-[10px] text-gray-500">Type this code on your TV below</span>
                </div>
              ) : (
                <button
                  onClick={handleGeneratePin}
                  disabled={isGeneratingPin}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPin ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingPin ? 'Generating PIN...' : 'Generate 6-Digit TV PIN'}</span>
                </button>
              )}
            </div>

            {/* Section 2: Enter Code from another device */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Step B: Receive Data on this Device
              </span>
              <p className="text-[11px] text-gray-400">
                Enter the 6 digits generated from your other device to download your watchlist and watch progress:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={7}
                  value={enteredPin}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '');
                    if (digits.length > 3) {
                      setEnteredPin(`${digits.slice(0, 3)}-${digits.slice(3, 6)}`);
                    } else {
                      setEnteredPin(digits);
                    }
                  }}
                  placeholder="e.g. 482-195"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-center text-lg font-black font-mono text-white tracking-widest placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleRedeemPin}
                  disabled={enteredPin.replace(/\D/g, '').length !== 6 || isRedeemingPin}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30 shrink-0"
                >
                  {isRedeemingPin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>{isRedeemingPin ? 'Pairing...' : 'Pair & Sync'}</span>
                </button>
              </div>

              {pinError && (
                <span className="text-xs text-red-400 font-semibold">{pinError}</span>
              )}

              {importSuccess && (
                <div className="p-2 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Data successfully synced! Closing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-3xl bg-[#07080e] border border-white/15 shadow-2xl">
              <img
                src={qrCodeUrl}
                alt="Device Sync QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            </div>

            <p className="text-xs text-gray-300 max-w-sm leading-relaxed">
              Open the camera on your phone or tablet and scan this code to instantly open Lumia 4K with your active Watchlist and Continue Watching history.
            </p>

            <button
              onClick={handleCopy}
              className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Sync URL Copied to Clipboard!' : 'Copy 1-Click Sync Link'}</span>
            </button>
          </div>
        )}

        {/* Direct Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              Paste the sync URL or payload code from your other device below to restore your Watchlist and resume progress:
            </p>

            <textarea
              value={importCode}
              onChange={e => setImportCode(e.target.value)}
              placeholder="Paste sync code or URL here..."
              rows={4}
              className="w-full p-3 rounded-2xl bg-white/5 border border-white/15 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />

            <button
              onClick={handleImport}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                importSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              {importSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{importSuccess ? 'Data Successfully Synced!' : 'Import & Sync Device'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
