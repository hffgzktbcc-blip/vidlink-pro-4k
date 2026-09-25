import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  Radio,
  MousePointer2,
  Keyboard,
} from 'lucide-react';
import { airRemoteManager, type RemoteHostState } from '../services/airRemote';
import { playSelectSound } from '../services/soundEffects';

interface AirRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotifyToast?: (title: string, desc?: string, type?: 'success' | 'info' | 'warning') => void;
}

export const AirRemoteModal: React.FC<AirRemoteModalProps> = ({
  isOpen,
  onClose,
  onNotifyToast,
}) => {
  const [remoteState, setRemoteState] = useState<RemoteHostState>(airRemoteManager.getState());
  const [isInitializing, setIsInitializing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const unsub = airRemoteManager.subscribe(
      () => {},
      state => setRemoteState(state)
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen && !remoteState.roomId && !isInitializing) {
      setIsInitializing(true);
      airRemoteManager
        .createHost()
        .then(() => {
          onNotifyToast?.('Air Remote Ready', 'Scan the QR code with your phone camera!', 'success');
        })
        .catch(() => {
          onNotifyToast?.('Remote Error', 'Failed to initialize WebRTC remote channel.', 'warning');
        })
        .finally(() => setIsInitializing(false));
    }
  }, [isOpen, remoteState.roomId, isInitializing, onNotifyToast]);

  if (!isOpen) return null;

  const remoteUrl =
    typeof window !== 'undefined' && remoteState.roomId
      ? `${window.location.origin}/?remote=${remoteState.roomId}`
      : '';

  const qrApiUrl = remoteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&bgcolor=000000&color=ffffff&margin=12&data=${encodeURIComponent(
        remoteUrl
      )}`
    : '';

  const handleCopyLink = () => {
    if (remoteUrl && navigator.clipboard) {
      navigator.clipboard.writeText(remoteUrl);
      setCopiedLink(true);
      playSelectSound();
      onNotifyToast?.('Link Copied', 'Remote URL copied to clipboard!', 'info');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85  flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e101a] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Phone Air-Remote</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Zero Install
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Use your smartphone as a glass touchpad & keyboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 flex flex-col items-center text-center">
          {/* Status Chip */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                remoteState.activeControllersCount > 0
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-gray-200">
              {remoteState.activeControllersCount > 0
                ? `${remoteState.activeControllersCount} Phone Connected`
                : 'Waiting for Phone to Scan...'}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative p-4 rounded-3xl bg-black border border-white/20 shadow-2xl mb-4 group">
            {qrApiUrl ? (
              <img
                src={qrApiUrl}
                alt="Air Remote QR Code"
                className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl object-contain mx-auto"
              />
            ) : (
              <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 text-xs">
                Generating secure channel...
              </div>
            )}
          </div>

          <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
            Point your iPhone or Android camera at the QR code above. No app installation or sign-in needed!
          </p>

          {/* Features highlight */}
          <div className="grid grid-cols-3 gap-2 w-full mt-5 pt-4 border-t border-white/10 text-[11px] text-gray-400">
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5">
              <MousePointer2 className="w-4 h-4 text-indigo-400" />
              <span>Touchpad</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>Phone Typing</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>0ms Latency</span>
            </div>
          </div>

          {/* Direct Link Copier */}
          {remoteUrl && (
            <div className="mt-5 w-full flex items-center gap-2">
              <input
                readOnly
                value={remoteUrl}
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-gray-400 font-mono truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
