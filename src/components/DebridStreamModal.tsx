import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Play,
  Copy,
  Check,
  HardDrive,
  Volume2,
  Tv,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { DirectStream } from '../services/streamResolver';
import { openInExternalPlayer } from '../services/streamResolver';
import { playSelectSound } from '../services/soundEffects';

interface DebridStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  streams: DirectStream[];
  currentStreamUrl?: string;
  onSelectStream: (stream: DirectStream) => void;
  onSwitchToEmbed?: () => void;
}

export const DebridStreamModal: React.FC<DebridStreamModalProps> = ({
  isOpen,
  onClose,
  title,
  streams,
  currentStreamUrl,
  onSelectStream,
  onSwitchToEmbed,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | '4k' | '1080p' | 'web'>('all');

  if (!isOpen) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    });
  };

  const filteredStreams = streams.filter(s => {
    if (filter === '4k') return s.quality === '4K Ultra HD';
    if (filter === '1080p') return s.quality === '1080p Ultra';
    if (filter === 'web') return s.isBrowserCompatible;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85  flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e101a] border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-7 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Select Quality</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {streams.length} Available
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate max-w-[260px] sm:max-w-md mt-0.5">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 py-3 border-b border-white/5 overflow-x-auto shrink-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">Quality:</span>
          {[
            { id: 'all', label: `All (${streams.length})` },
            { id: '4k', label: `4K UHD (${streams.filter(s => s.quality === '4K Ultra HD').length})` },
            { id: '1080p', label: `1080p (${streams.filter(s => s.quality === '1080p Ultra').length})` },
            { id: 'web', label: `Browser Ready (${streams.filter(s => s.isBrowserCompatible).length})` },
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === pill.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Stream List */}
        <div className="overflow-y-auto space-y-2 py-4 flex-1 pr-1">
          {filteredStreams.length > 0 ? (
            filteredStreams.map((s, idx) => {
              const isSelected = currentStreamUrl === s.url;
              const is4K = s.quality === '4K Ultra HD';
              const optionLabel = `Option ${String.fromCharCode(65 + idx)}`;

              return (
                <div
                  key={`${s.url}-${idx}`}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-400/80 ring-1 ring-indigo-400/50'
                      : 'bg-white/5 hover:bg-white/[0.08] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded ${
                        is4K
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {is4K ? '4K Ultra HD' : '1080p Full HD'}
                      </span>

                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white/[0.08] text-gray-300 border border-white/10">
                        {optionLabel}
                      </span>

                      {s.fileSize && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-white/10 text-gray-200 border border-white/10 flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-gray-400" />{s.fileSize}
                        </span>
                      )}

                      {s.audioChannels && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-purple-400" />{s.audioChannels}
                        </span>
                      )}

                      {s.videoCodec && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-white/5 text-gray-400 border border-white/5">
                          {s.videoCodec}
                        </span>
                      )}

                      {s.isBrowserCompatible ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />Plays in Browser
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-white/10 text-gray-300 border border-white/10">
                          Best with VLC
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-500">
                      {is4K ? '4K Blu-ray' : 'Full HD'} · Instantly cached via Real-Debrid
                      {s.fileSize ? ` · ${s.fileSize}` : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { playSelectSound(); onSelectStream(s); onClose(); }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 active:scale-95'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{isSelected ? 'Playing' : 'Play'}</span>
                    </button>

                    <button
                      onClick={() => openInExternalPlayer(s.url, title)}
                      className="p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all"
                      title="Open in VLC / external player"
                    >
                      <Tv className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopy(s.url)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
                      title="Copy stream link"
                    >
                      {copiedUrl === s.url ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center bg-white/5 rounded-2xl border border-white/10 p-6">
              <p className="text-sm font-bold text-white">No streams match this filter</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting "All" to view all available streams.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <p className="text-gray-500 text-[11px]">Streams are instantly cached via Real-Debrid — no waiting or buffering.</p>
          {onSwitchToEmbed && (
            <button onClick={() => { onSwitchToEmbed(); onClose(); }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>Use Free Mirrors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
