import React, { useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import type { MediaItem, WatchHistoryItem } from '../types';
import { playSelectSound } from '../services/soundEffects';

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
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

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

  // Generate a dynamic SVG QR code representation via Google Chart API fallback
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
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Instant Device Sync</h2>
            <p className="text-xs text-gray-400">
              Sync watchlist & resume progress between TV, Phone, and PC.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'export' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Export to Phone/TV (QR)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'import' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Import Sync Code
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="flex flex-col items-center text-center space-y-4">
            {/* QR Code Container */}
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

        {/* Import Tab */}
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
