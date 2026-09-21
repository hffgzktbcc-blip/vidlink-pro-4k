import axios from 'axios';
import type { MediaType } from '../types';
import type { DirectStream } from './streamResolver';
import { fetchImdbId } from './tmdb';

export const STREMIO_ADDON_STORAGE_KEY = 'lumia_stremio_addon_url_v1';
export const REALDEBRID_KEY_STORAGE_KEY = 'lumia_realdebrid_key_v1';

export function getStoredStremioAddonUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STREMIO_ADDON_STORAGE_KEY) || '';
}

export function setStoredStremioAddonUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = url.trim();
  if (clean) {
    localStorage.setItem(STREMIO_ADDON_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(STREMIO_ADDON_STORAGE_KEY);
  }
}

export function getStoredRealDebridKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REALDEBRID_KEY_STORAGE_KEY) || '';
}

export function setStoredRealDebridKey(key: string): void {
  if (typeof window === 'undefined') return;
  const clean = key.trim();
  if (clean) {
    localStorage.setItem(REALDEBRID_KEY_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(REALDEBRID_KEY_STORAGE_KEY);
  }
}

export interface RealDebridAccountInfo {
  valid: boolean;
  username?: string;
  email?: string;
  premiumDaysRemaining?: number;
  type?: string;
  error?: string;
}

/**
 * Validates a Real-Debrid API token against official REST API
 */
export async function validateRealDebridToken(token: string): Promise<RealDebridAccountInfo> {
  if (!token) return { valid: false, error: 'Token is empty' };
  try {
    const res = await axios.get('https://api.real-debrid.com/rest/1.0/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
      timeout: 7000,
    });
    const data = res.data;
    const expiration = data.expiration ? new Date(data.expiration).getTime() : 0;
    const now = Date.now();
    const daysLeft = Math.max(0, Math.round((expiration - now) / (1000 * 60 * 60 * 24)));

    return {
      valid: true,
      username: data.username,
      email: data.email,
      type: data.type,
      premiumDaysRemaining: daysLeft,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.response?.data?.message || 'Invalid or expired token',
    };
  }
}

/**
 * Determines whether Stremio Remux engine is active
 */
export function isStremioEngineConfigured(): boolean {
  return !!(getStoredStremioAddonUrl() || getStoredRealDebridKey());
}

interface RawStremioStream {
  name?: string;
  title?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  behaviorHints?: {
    bingeGroup?: string;
    notWebReady?: boolean;
    proxyHeaders?: Record<string, string>;
  };
}

/**
 * Resolves direct uncompressed 4K Blu-ray Remux streams using Stremio Addon protocol
 * (Torrentio, Comet, MediaFusion, or Real-Debrid auto-configured bridge)
 */
export async function resolveStremioStreams(
  tmdbId: number,
  type: MediaType,
  season: number = 1,
  episode: number = 1
): Promise<DirectStream[]> {
  const addonUrl = getStoredStremioAddonUrl();
  const rdKey = getStoredRealDebridKey();

  if (!addonUrl && !rdKey) {
    return [];
  }

  // 1. Resolve IMDb ID (e.g. tt15398776)
  const imdbId = await fetchImdbId(tmdbId, type);
  if (!imdbId) {
    console.warn('⚠️ Lumia Stremio Engine: No IMDb ID found for TMDB ID', tmdbId);
    return [];
  }

  // 2. Build the addon base URL
  let baseUrl = addonUrl;
  if (!baseUrl && rdKey) {
    // Auto-synthesize Torrentio + Real-Debrid manifest URL if user entered RD token
    baseUrl = `https://torrentio.strem.fun/realdebrid=${rdKey.trim()}|qualityfilter=scr,cam|sort=quality`;
  }

  // Normalize by stripping /manifest.json if present
  baseUrl = baseUrl.replace(/\/manifest\.json$/, '').replace(/\/$/, '');

  // 3. Construct stream endpoint
  const streamType = type === 'movie' ? 'movie' : 'series';
  const streamId = type === 'movie' ? imdbId : `${imdbId}:${season}:${episode}`;
  const streamEndpoint = `${baseUrl}/stream/${streamType}/${streamId}.json`;

  try {
    const res = await axios.get<{ streams?: RawStremioStream[] }>(streamEndpoint, {
      timeout: 10000,
    });

    const rawStreams = res.data?.streams || [];
    const directStreams: DirectStream[] = [];

    for (const s of rawStreams) {
      // Must have direct HTTP(S) URL (Real-Debrid / debrid-cached uncompressed stream)
      if (!s.url || !s.url.startsWith('http')) continue;

      const rawText = `${s.name || ''} ${s.title || ''}`;
      let quality: '4K Ultra HD' | '1080p Ultra' | '720p HD' | 'Auto HD' = '1080p Ultra';

      if (/4k|2160p|uhd|remux/i.test(rawText)) {
        quality = '4K Ultra HD';
      } else if (/1080p|fhd/i.test(rawText)) {
        quality = '1080p Ultra';
      } else if (/720p|hd/i.test(rawText)) {
        quality = '720p HD';
      }

      // Format clean provider name for the UI
      let provider = s.name || 'Remux 4K Direct';
      if (s.title) {
        // Extract file size or audio tags if available (e.g., "💾 48.2 GB • Atmos")
        const sizeMatch = s.title.match(/💾\s*([\d\.]+\s*[GM]B)/i);
        const audioMatch = s.title.match(/Atmos|TrueHD|DTS-HD|5\.1|7\.1/i);
        const details = [
          sizeMatch ? sizeMatch[1] : null,
          audioMatch ? audioMatch[0] : null,
        ].filter(Boolean).join(' • ');

        if (details) {
          provider = `${provider} (${details})`;
        }
      }

      directStreams.push({
        url: s.url,
        quality,
        isM3U8: s.url.includes('.m3u8'),
        provider,
        headers: s.behaviorHints?.proxyHeaders,
      });
    }

    return directStreams;
  } catch (err) {
    console.warn('⚠️ Lumia Stremio Engine: Failed to query addon streams:', err);
    return [];
  }
}
