import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Radio,
  Share2,
  Sparkles,
  LogOut,
  Play,
} from 'lucide-react';
import {
  watchPartyManager,
  type WatchPartyState,
} from '../services/watchParty';
import { playSelectSound } from '../services/soundEffects';

interface WatchPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotifyToast?: (title: string, desc?: string, type?: 'success' | 'info' | 'warning') => void;
}

export const WatchPartyModal: React.FC<WatchPartyModalProps> = ({
  isOpen,
  onClose,
  onNotifyToast,
}) => {
  const [partyState, setPartyState] = useState<WatchPartyState>(watchPartyManager.getState());
  const [joinInput, setJoinInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const unsubscribe = watchPartyManager.subscribe(
      () => {},
      (state) => setPartyState(state)
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const partyUrl = typeof window !== 'undefined' && partyState.roomId
    ? `${window.location.origin}/?party=${partyState.roomId}`
    : '';

  const handleCreate = async () => {
    setIsConnecting(true);
    try {
      const id = await watchPartyManager.createRoom();
      playSelectSound();
      onNotifyToast?.('Watch Party Started', `Room ${id} is live! Share your invite link.`, 'success');
    } catch {
      onNotifyToast?.('Connection Error', 'Could not establish P2P watch party.', 'warning');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoin = async () => {
    let clean = joinInput.trim();
    if (clean.includes('party=')) {
      clean = clean.split('party=')[1].split('&')[0];
    }
    if (!clean) return;

    setIsConnecting(true);
    try {
      await watchPartyManager.joinRoom(clean);
      playSelectSound();
      onNotifyToast?.('Joined Watch Party', `Successfully connected to Room ${clean}!`, 'success');
      onClose();
    } catch {
      onNotifyToast?.('Join Failed', 'Could not connect to host. Make sure host room is open.', 'warning');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && partyUrl) {
      navigator.clipboard.writeText(partyUrl);
      setCopiedLink(true);
      playSelectSound();
      onNotifyToast?.('Link Copied', 'Watch Party invite link copied to clipboard!', 'info');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleLeave = () => {
    watchPartyManager.leaveRoom();
    playSelectSound();
    onNotifyToast?.('Watch Party Ended', 'You disconnected from the party.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85  flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e101a] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-7">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>SyncPlay Watch Party</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-600/30 text-purple-300 border border-purple-500/40">
                P2P Zero-Server
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Stream movies and shows in perfect sync with friends anywhere in the world.
            </p>
          </div>
        </div>

        {partyState.roomId ? (
          /* Active Room View */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Live Party Connected
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white font-bold text-xs">
                  {partyState.memberCount} {partyState.memberCount === 1 ? 'Viewer' : 'Viewers'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-400">Room Code:</span>
                <div className="text-xl font-black font-mono tracking-widest text-indigo-300">
                  {partyState.roomId}
                </div>
              </div>

              {/* Shareable Link Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  readOnly
                  value={partyUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-gray-300 select-all"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Whenever the host plays, pauses, or seeks, all connected members will automatically stay in sync frame-for-frame!
            </p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleLeave}
                className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Party</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                Return to Cinema
              </button>
            </div>
          </div>
        ) : (
          /* Join / Host Selection */
          <div className="space-y-5">
            {/* Host Section */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Start a New Party</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                You will be the host. You can invite friends with a single link, and control playback for the whole group.
              </p>
              <button
                onClick={handleCreate}
                disabled={isConnecting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isConnecting ? 'Starting Party...' : 'Create Watch Party Room'}</span>
              </button>
            </div>

            {/* Join Section */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Join a Friend's Party</span>
              </span>
              <p className="text-[11px] text-gray-400">
                Paste your friend's room code or invite URL to connect directly.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinInput}
                  onChange={e => setJoinInput(e.target.value)}
                  placeholder="Paste Room ID (e.g. lumia-AB12) or link..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinInput.trim() || isConnecting}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-xs font-bold text-white transition-all shrink-0"
                >
                  {isConnecting ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
