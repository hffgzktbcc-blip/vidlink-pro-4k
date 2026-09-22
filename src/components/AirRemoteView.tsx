import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Search,
  X,
  Maximize2,
  ArrowLeft,
  Tv,
  Dices,
  Smartphone,
  Compass,
  Film,
} from 'lucide-react';
import { airRemoteManager, type RemoteKeyAction, type RemoteMediaAction } from '../services/airRemote';

interface AirRemoteViewProps {
  hostId: string;
  onExit: () => void;
}

export const AirRemoteView: React.FC<AirRemoteViewProps> = ({ hostId, onExit }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'touchpad' | 'dpad'>('dpad');
  const [hapticsEnabled] = useState(true);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = useCallback((ms = 15) => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, [hapticsEnabled]);

  // Connect to TV Host over WebRTC
  useEffect(() => {
    setIsConnecting(true);
    setConnectionError(null);

    airRemoteManager
      .connectAsRemote(hostId)
      .then(() => {
        setIsConnected(true);
        triggerHaptic(40);
      })
      .catch(err => {
        console.error('Remote connect failed:', err);
        setConnectionError('Could not reach TV. Verify TV screen has Air Remote open.');
      })
      .finally(() => setIsConnecting(false));

    return () => {
      airRemoteManager.disconnect();
    };
  }, [hostId, triggerHaptic]);

  // Send D-pad navigation key
  const sendKey = (key: RemoteKeyAction) => {
    triggerHaptic(20);
    airRemoteManager.sendCommand({
      type: 'KEY',
      key,
    });
  };

  // Send media action
  const sendAction = (action: RemoteMediaAction) => {
    triggerHaptic(25);
    airRemoteManager.sendCommand({
      type: 'ACTION',
      action,
    });
  };

  // Live phone typing sync to TV search bar
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    airRemoteManager.sendCommand({
      type: 'SEARCH',
      text: val,
    });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    airRemoteManager.sendCommand({
      type: 'SEARCH',
      text: '',
    });
  };

  // Touchpad touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    lastTouchRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - lastTouchRef.current.x;
    const dy = t.clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: t.clientX, y: t.clientY };

    airRemoteManager.sendCommand({
      type: 'CURSOR_DELTA',
      dx: dx * 1.5,
      dy: dy * 1.5,
    });
  };

  const handleTouchEnd = () => {
    if (touchStartRef.current && lastTouchRef.current) {
      const dist = Math.hypot(
        lastTouchRef.current.x - touchStartRef.current.x,
        lastTouchRef.current.y - touchStartRef.current.y
      );
      // Small distance is considered a tap / click
      if (dist < 10) {
        triggerHaptic(30);
        airRemoteManager.sendCommand({
          type: 'CURSOR_CLICK',
        });
      }
    }
    touchStartRef.current = null;
    lastTouchRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080d] text-white flex flex-col justify-between select-none overflow-hidden touch-none p-4 pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight">Lumia Air-Remote</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {isConnected ? 'Connected to TV' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('dpad')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dpad' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400'
              }`}
            >
              D-Pad
            </button>
            <button
              onClick={() => setActiveTab('touchpad')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'touchpad' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400'
              }`}
            >
              Touchpad
            </button>
          </div>

          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            title="Exit Remote"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="my-4 p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs text-center">
          {connectionError}
        </div>
      )}

      {/* Live Phone-to-TV Keyboard Input Bar */}
      <div className="mt-3 relative shrink-0">
        <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              sendKey('Enter');
            }
          }}
          placeholder="Type here to search TV in real-time..."
          className="w-full bg-white/10 border border-white/20 focus:border-indigo-500 focus:bg-white/15 text-white placeholder-gray-400 text-xs rounded-2xl pl-10 pr-10 py-3 shadow-inner focus:outline-none transition-all"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Central Interactive Controller Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 relative">
        {activeTab === 'touchpad' ? (
          /* Glass Touchpad Mode */
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full max-h-[360px] rounded-3xl bg-gradient-to-b from-white/5 to-white/10 border border-white/20 shadow-2xl flex flex-col items-center justify-center relative active:border-indigo-500/50 transition-colors"
          >
            <div className="text-center pointer-events-none opacity-40">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Glass Touchpad
              </span>
              <p className="text-[11px] text-gray-400 mt-1">Swipe to glide cursor • Tap to click</p>
            </div>
          </div>
        ) : (
          /* D-Pad Controller Mode */
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-black/60 border border-white/15 shadow-2xl p-3 flex items-center justify-center">
            {/* Up */}
            <button
              onClick={() => sendKey('ArrowUp')}
              className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <ChevronUp className="w-8 h-8" />
            </button>

            {/* Down */}
            <button
              onClick={() => sendKey('ArrowDown')}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <ChevronDown className="w-8 h-8" />
            </button>

            {/* Left */}
            <button
              onClick={() => sendKey('ArrowLeft')}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Right */}
            <button
              onClick={() => sendKey('ArrowRight')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Center OK Button */}
            <button
              onClick={() => sendKey('Enter')}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm shadow-xl shadow-indigo-600/40 border border-indigo-400 active:scale-90 transition-all flex items-center justify-center"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Secondary Controls Bar (Back, Cinema Roulette, Fullscreen) */}
      <div className="grid grid-cols-4 gap-2 w-full mb-3 shrink-0">
        <button
          onClick={() => sendKey('Escape')}
          className="p-3 rounded-2xl bg-white/10 active:bg-white/20 text-gray-200 text-xs font-bold flex flex-col items-center gap-1 border border-white/10 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-rose-400" />
          <span>Back</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(25);
            airRemoteManager.sendCommand({ type: 'SURPRISE_ME' });
          }}
          className="p-3 rounded-2xl bg-white/10 active:bg-white/20 text-gray-200 text-xs font-bold flex flex-col items-center gap-1 border border-white/10 active:scale-95 transition-all"
        >
          <Dices className="w-4 h-4 text-pink-400" />
          <span>Roulette</span>
        </button>

        <button
          onClick={() => sendAction('PLAY_PAUSE')}
          className="p-3 rounded-2xl bg-white/10 active:bg-white/20 text-gray-200 text-xs font-bold flex flex-col items-center gap-1 border border-white/10 active:scale-95 transition-all"
        >
          <Play className="w-4 h-4 text-emerald-400" />
          <span>Play/Pause</span>
        </button>

        <button
          onClick={() => sendAction('FULLSCREEN')}
          className="p-3 rounded-2xl bg-white/10 active:bg-white/20 text-gray-200 text-xs font-bold flex flex-col items-center gap-1 border border-white/10 active:scale-95 transition-all"
        >
          <Maximize2 className="w-4 h-4 text-cyan-400" />
          <span>Cinema</span>
        </button>
      </div>

      {/* TV Quick Navigation Switcher */}
      <div className="flex items-center justify-around py-2 px-3 rounded-2xl bg-black/60 border border-white/10 shrink-0 text-xs">
        <button
          onClick={() => {
            triggerHaptic(15);
            airRemoteManager.sendCommand({ type: 'NAVIGATE', tab: 'home' });
          }}
          className="p-2 text-gray-400 hover:text-white font-bold flex items-center gap-1"
        >
          <Tv className="w-3.5 h-3.5 text-indigo-400" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            airRemoteManager.sendCommand({ type: 'NAVIGATE', tab: 'universes' });
          }}
          className="p-2 text-gray-400 hover:text-white font-bold flex items-center gap-1"
        >
          <Compass className="w-3.5 h-3.5 text-purple-400" />
          <span>Universes</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            airRemoteManager.sendCommand({ type: 'NAVIGATE', tab: '4k' });
          }}
          className="p-2 text-gray-400 hover:text-white font-bold flex items-center gap-1"
        >
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span>4K UHD</span>
        </button>
      </div>
    </div>
  );
};
