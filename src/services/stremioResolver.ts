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

export function isRealDebridConfigured(): boolean {
  return Boolean(getStoredRealDebridKey());
}

export function isStremioEngineConfigured(): boolean {
  return Boolean(getStoredStremioAddonUrl() || getStoredRealDebridKey());
}

export interface RealDebridAccountInfo {
  valid: boolean;
  username?: string;
  email?: string;
  premiumDaysRemaining?: number;
  type?: string;
  expirationDate?: string;
  avatar?: string;
  error?: string;
}

export interface RealDebridDeviceCodeResponse {
  device_code: string;
  user_code: string;
  interval: number;
  expires_in: number;
  verification_url: string;
  direct_verification_url: string;
}

const RD_CLIENT_ID = 'X245A4XAIBGVM';

/**
 * Universal CORS-safe API caller for Real-Debrid
 * Tier 1: Relative /api/debrid (Cloudflare Pages Functions / Vercel Edge / Vite Dev Proxy)
 * Tier 2: Public CORS proxy fallback (corsproxy.io)
 * Tier 3: Direct API call
 */
async function callDebridApi<T = any>(
  endpoint: string,
  token?: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any,
  params?: Record<string, string>
): Promise<T> {
  const cleanToken = (token || getStoredRealDebridKey()).trim();
  const headers: Record<string, string> = {};
  if (cleanToken) {
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  // Tier 1: Try edge proxy /api/debrid
  try {
    const queryParams = new URLSearchParams({ endpoint, ...(params || {}) });
    const edgeUrl = `/api/debrid?${queryParams.toString()}`;
    const res = await axios({
      url: edgeUrl,
      method,
      data,
      headers,
      timeout: 8000,
    });
    return res.data;
  } catch (edgeErr: any) {
    // If not a 401/403 auth error, try fallback tiers
    if (edgeErr.response && (edgeErr.response.status === 401 || edgeErr.response.status === 403)) {
      throw edgeErr;
    }
  }

  // Tier 2: Public CORS proxy fallback
  const isOauth = endpoint.startsWith('oauth/');
  const targetBase = isOauth ? 'https://api.real-debrid.com/' : 'https://api.real-debrid.com/rest/1.0/';
  const queryStr = params ? new URLSearchParams(params).toString() : '';
  const directTarget = `${targetBase}${endpoint}${queryStr ? `?${queryStr}` : ''}`;

  try {
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(directTarget)}`;
    const res = await axios({
      url: corsProxyUrl,
      method,
      data,
      headers,
      timeout: 8000,
    });
    return res.data;
  } catch (proxyErr: any) {
    if (proxyErr.response && (proxyErr.response.status === 401 || proxyErr.response.status === 403)) {
      throw proxyErr;
    }
  }

  // Tier 3: Direct API call
  const res = await axios({
    url: directTarget,
    method,
    data,
    headers,
    timeout: 8000,
  });
  return res.data;
}

/**
 * Validates a Real-Debrid API token against official REST API
 */
export async function validateRealDebridToken(token: string): Promise<RealDebridAccountInfo> {
  if (!token || !token.trim()) {
    return { valid: false, error: 'Token cannot be empty' };
  }

  try {
    const data = await callDebridApi('user', token.trim());
    const expiration = data.expiration ? new Date(data.expiration).getTime() : 0;
    const now = Date.now();
    const daysLeft = Math.max(0, Math.round((expiration - now) / (1000 * 60 * 60 * 24)));

    return {
      valid: true,
      username: data.username,
      email: data.email,
      type: data.type,
      expirationDate: data.expiration,
      premiumDaysRemaining: daysLeft,
      avatar: data.avatar,
    };
  } catch (err: any) {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      (err.response?.status === 401 ? 'Invalid or expired API token' : 'Could not reach Real-Debrid servers');
    return {
      valid: false,
      error: msg,
    };
  }
}

/**
 * Initiates Real-Debrid OAuth Device Flow (Zero typing on TV/mobile)
 */
export async function startDebridDeviceAuth(): Promise<RealDebridDeviceCodeResponse> {
  const data = await callDebridApi<RealDebridDeviceCodeResponse>(
    'oauth/v2/device/code',
    undefined,
    'GET',
    undefined,
    {
      client_id: RD_CLIENT_ID,
      new_credentials: 'yes',
    }
  );
  return data;
}

/**
 * Polls for user authorization on real-debrid.com/device
 */
export async function pollDebridDeviceCredentials(
  deviceCode: string
): Promise<{ client_id: string; client_secret: string } | null> {
  try {
    const data = await callDebridApi(
      'oauth/v2/device/credentials',
      undefined,
      'GET',
      undefined,
      {
        client_id: RD_CLIENT_ID,
        code: deviceCode,
      }
    );
    if (data && data.client_id && data.client_secret) {
      return { client_id: data.client_id, client_secret: data.client_secret };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Exchanges client credentials & device code for an official access token
 */
export async function exchangeDebridToken(
  clientId: string,
  clientSecret: string,
  deviceCode: string
): Promise<string> {
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('code', deviceCode);
  params.append('grant_type', 'http://oauth.net/grant_type/device/1.0');

  const data = await callDebridApi(
    'oauth/v2/token',
    undefined,
    'POST',
    params.toString()
  );
  if (!data?.access_token) {
    throw new Error('No access_token returned by Real-Debrid');
  }
  return data.access_token;
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
 * (Torrentio + Real-Debrid auto-configured bridge)
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
      timeout: 12000,
    });

    const rawStreams = res.data?.streams || [];
    const directStreams: DirectStream[] = [];

    for (const s of rawStreams) {
      // Must have direct HTTP(S) URL (Real-Debrid / debrid-cached uncompressed stream)
      if (!s.url || !s.url.startsWith('http')) continue;

      // Filter out Torrentio error videos (e.g. "RD error" or "Invalid RealDebrid ApiKey/Token!")
      if (
        s.name?.includes('RD error') ||
        s.title?.includes('Invalid') ||
        s.url?.includes('failed_access')
      ) {
        continue;
      }

      const rawText = `${s.name || ''} ${s.title || ''}`;

      // Detect resolution & quality
      let quality: '4K Ultra HD' | '1080p Ultra' | '720p HD' | 'Auto HD' = '1080p Ultra';
      let resolution = '1080p';

      if (/4k|2160p|uhd|remux/i.test(rawText)) {
        quality = '4K Ultra HD';
        resolution = '4K';
      } else if (/1080p|fhd/i.test(rawText)) {
        quality = '1080p Ultra';
        resolution = '1080p';
      } else if (/720p|hd/i.test(rawText)) {
        quality = '720p HD';
        resolution = '720p';
      }

      // Extract file size (e.g. 💾 48.2 GB)
      const sizeMatch = s.title?.match(/💾\s*([\d\.]+\s*[GM]B)/i);
      const fileSize = sizeMatch ? sizeMatch[1] : undefined;

      // Extract audio codec tags
      let audioChannels: string | undefined;
      const audioMatch = s.title?.match(/Atmos|TrueHD|DTS-HD|DTS|5\.1|7\.1|AAC/i);
      if (audioMatch) {
        audioChannels = audioMatch[0];
      }

      // Extract video codec
      let videoCodec: string | undefined;
      if (/hevc|x265|h\.265|2160p/i.test(rawText)) {
        videoCodec = 'HEVC / H.265';
      } else if (/av1/i.test(rawText)) {
        videoCodec = 'AV1';
      } else if (/x264|h\.264|avc/i.test(rawText)) {
        videoCodec = 'AVC / H.264';
      }

      // Detect container
      let container: 'mp4' | 'mkv' | 'webm' | 'm3u8' = 'mkv';
      const cleanUrl = s.url.split('?')[0].toLowerCase();
      if (cleanUrl.endsWith('.mp4') || s.title?.toLowerCase().includes('.mp4')) {
        container = 'mp4';
      } else if (cleanUrl.endsWith('.m3u8')) {
        container = 'm3u8';
      } else if (cleanUrl.endsWith('.webm')) {
        container = 'webm';
      }

      // Browser compatibility check:
      // MKV with DTS/TrueHD is not native in Chrome/Safari/Firefox (needs VLC / Just Player)
      // MP4, WebM, and HLS are browser ready
      const isBrowserCompatible = container === 'mp4' || container === 'm3u8' || container === 'webm';

      // Format clean provider name for the UI
      let provider = s.name || 'Real-Debrid 4K';
      if (s.title) {
        const details = [
          fileSize,
          audioChannels,
          videoCodec,
        ].filter(Boolean).join(' • ');

        if (details) {
          provider = `${provider} (${details})`;
        }
      }

      directStreams.push({
        url: s.url,
        quality,
        resolution,
        fileSize,
        rawTitle: s.title || s.name || 'Untitled Stream',
        audioChannels,
        videoCodec,
        container,
        isBrowserCompatible,
        isCached: true,
        isM3U8: container === 'm3u8' || s.url.includes('.m3u8'),
        provider,
        headers: s.behaviorHints?.proxyHeaders,
      });
    }

    // Sort: 4K Ultra HD first, then 1080p; within same quality, sort by file size descending
    return directStreams.sort((a, b) => {
      const qScore = (q: string) => (q === '4K Ultra HD' ? 3 : q === '1080p Ultra' ? 2 : 1);
      const scoreDiff = qScore(b.quality) - qScore(a.quality);
      if (scoreDiff !== 0) return scoreDiff;

      const parseBytes = (s?: string) => {
        if (!s) return 0;
        const num = parseFloat(s);
        if (s.includes('GB')) return num * 1024;
        return num;
      };
      return parseBytes(b.fileSize) - parseBytes(a.fileSize);
    });
  } catch (err) {
    console.warn('⚠️ Lumia Stremio Engine: Failed to query addon streams:', err);
    return [];
  }
}
