import type { MediaItem, WatchHistoryItem } from '../types';

export interface PairingResult {
  pin: string;
  formattedPin: string;
  expiresAt: number;
}

export interface PairingData {
  watchlist: MediaItem[];
  history: WatchHistoryItem[];
}

export async function generateTvPairingPin(
  watchlist: MediaItem[],
  history: WatchHistoryItem[]
): Promise<PairingResult | null> {
  const syncPayload = {
    w: watchlist.slice(0, 50).map(item => ({
      id: item.id,
      title: item.title || item.name,
      media_type: item.media_type,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
    })),
    h: history.slice(0, 30).map(entry => ({
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

  try {
    const res = await fetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncPayload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        pin: data.pin,
        formattedPin: data.formattedPin,
        expiresAt: data.expiresAt,
      };
    }
  } catch (err) {
    console.warn('Direct /api/pair failed, falling back to local pairing code:', err);
  }

  // Fallback if running outside Cloudflare edge
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    pin: randomPin,
    formattedPin: `${randomPin.slice(0, 3)}-${randomPin.slice(3)}`,
    expiresAt: Date.now() + 600000,
  };
}

export async function redeemTvPairingPin(pin: string): Promise<PairingData | null> {
  const cleanPin = pin.replace(/\D/g, '');
  if (cleanPin.length !== 6) return null;

  try {
    const res = await fetch(`/api/pair?pin=${cleanPin}`);
    if (res.ok) {
      const data = await res.json();
      return {
        watchlist: data.w || [],
        history: data.h || [],
      };
    }
  } catch (err) {
    console.warn('Failed to redeem pairing PIN:', err);
  }

  return null;
}
