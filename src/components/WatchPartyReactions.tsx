import React, { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { watchPartyManager, type WatchPartyState } from '../services/watchParty';

const PARTY_EMOJIS = ['🔥', '🍿', '😱', '❤️', '😂', '👏'];

interface WatchPartyReactionsProps {
  onOpenPartyModal: () => void;
  showBar?: boolean;
}

interface ActiveEmoji {
  id: string;
  emoji: string;
  leftPercent: number;
  rotation: number;
}

export const WatchPartyReactions: React.FC<WatchPartyReactionsProps> = ({
  onOpenPartyModal,
  showBar = true,
}) => {
  const [partyState, setPartyState] = useState<WatchPartyState>(() => watchPartyManager.getState());
  const [activeEmojis, setActiveEmojis] = useState<ActiveEmoji[]>([]);

  const spawnEmoji = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    // Random position between 15% and 85% width
    const leftPercent = 15 + Math.random() * 70;
    const rotation = (Math.random() - 0.5) * 30;

    setActiveEmojis(prev => [...prev, { id, emoji, leftPercent, rotation }]);

    setTimeout(() => {
      setActiveEmojis(prev => prev.filter(item => item.id !== id));
    }, 2400);
  }, []);

  useEffect(() => {
    const unsubscribe = watchPartyManager.subscribe(
      msg => {
        if (msg.type === 'REACTION' && msg.payload?.emoji) {
          spawnEmoji(msg.payload.emoji);
        }
      },
      state => {
        setPartyState(state);
      }
    );

    return unsubscribe;
  }, [spawnEmoji]);

  const handleSendReaction = (emoji: string) => {
    watchPartyManager.broadcastReaction(emoji);
  };

  return (
    <>
      {/* Floating Animated Emojis Screen Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none">
        {activeEmojis.map(item => (
          <div
            key={item.id}
            className="absolute bottom-24 animate-float-up text-4xl sm:text-5xl md:text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] filter transition-transform"
            style={{
              left: `${item.leftPercent}%`,
              transform: `rotate(${item.rotation}deg)`,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Floating Reaction Bar & Party Status */}
      {showBar && (
        <div className="fixed bottom-28 md:bottom-32 right-4 md:right-8 z-40 flex items-center gap-2 pointer-events-auto">
          {/* Reaction Emoji Pill */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100">
            {/* Quick Toggle / Party Member Pill */}
            <button
              data-tv-focus="true"
              onClick={onOpenPartyModal}
              title={
                partyState.isConnected
                  ? `Watch Party Active (${partyState.memberCount} viewers) - Click to invite friends`
                  : 'Start Watch Party (P2P SyncPlay with Friends)'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                partyState.isConnected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400'
                  : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{partyState.isConnected ? `${partyState.memberCount} Watching` : 'Party'}</span>
              {partyState.isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Quick Reaction Emojis */}
            <div className="flex items-center gap-1 pl-1">
              {PARTY_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  data-tv-focus="true"
                  onClick={() => handleSendReaction(emoji)}
                  title={`Send ${emoji} Reaction`}
                  className="w-8 h-8 rounded-full hover:bg-white/20 active:scale-125 flex items-center justify-center text-lg transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
