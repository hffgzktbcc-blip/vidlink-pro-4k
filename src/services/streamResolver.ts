import type { MediaType } from '../types';
import { resolveStremioStreams, isStremioEngineConfigured } from './stremioResolver';

export interface DirectSubtitle {
  label: string;
  file: string;
  lang?: string;
  default?: boolean;
}

export interface DirectStream {
  url: string;
  quality: '4K Ultra HD' | '1080p Ultra' | '720p HD' | 'Auto HD';
  isM3U8: boolean;
  provider: string;
  headers?: Record<string, string>;
  subtitles?: DirectSubtitle[];
  resolution?: string;
  fileSize?: string;
  rawTitle?: string;
  audioChannels?: string;
  videoCodec?: string;
  container?: 'mp4' | 'mkv' | 'webm' | 'm3u8';
  isBrowserCompatible?: boolean;
  isCached?: boolean;
  sourceGroup?: string;
  isHighDmcaRisk?: boolean;
}

export interface StreamResolutionResult {
  directStreams: DirectStream[];
  defaultStream?: DirectStream;
  fallbackIframeUrl: string;
}

/**
 * Resolves direct HLS (.m3u8) / MP4 4K Remux video streams for movies and TV episodes.
 * If Stremio / Real-Debrid is configured, fetches uncompressed 4K Blu-ray Remux streams.
 * Otherwise, falls back to the clean 1-click VidLink Pro 4K web mirror.
 */
export async function resolveStreamSources(
  tmdbId: number,
  type: MediaType,
  season: number = 1,
  episode: number = 1
): Promise<StreamResolutionResult> {
  const fallbackIframeUrl =
    type === 'movie'
      ? `https://vidlink.pro/movie/${tmdbId}?autoplay=true`
      : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?autoplay=true`;

  let streams: DirectStream[] = [];

  // Check if user has Stremio Addon or Real-Debrid configured
  if (isStremioEngineConfigured()) {
    try {
      streams = await resolveStremioStreams(tmdbId, type, season, episode);
    } catch (err) {
      console.warn('Fallback to standard stream due to resolver error:', err);
    }
  }

  // Pick first browser-compatible stream as default if available, otherwise first stream
  const defaultStream =
    streams.find(s => s.isBrowserCompatible) || streams[0];

  return {
    directStreams: streams,
    defaultStream,
    fallbackIframeUrl,
  };
}

/**
 * Helper to launch external Android TV player (Just Player / VLC / MX Player)
 * or desktop VLC / IINA / Infuse
 */
export function openInExternalPlayer(streamUrl: string, title: string): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Android Native Platform via Capacitor
  const cap = (window as any).Capacitor;
  if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
    try {
      // In Android native, fire ACTION_VIEW intent with video/mp4 or application/x-mpegURL
      window.location.href = `intent:${streamUrl}#Intent;type=video/*;title=${encodeURIComponent(title)};end`;
      return true;
    } catch {}
  }

  // 2. Try VLC deep-link protocol (vlc://...)
  try {
    const vlcProtocol = `vlc://${streamUrl}`;
    window.location.href = vlcProtocol;
    return true;
  } catch {
    // 3. Web fallback: open stream link in new tab
    window.open(streamUrl, '_blank');
    return false;
  }
}

/**
 * Helper to generate VLC deep-link URL
 */
export function getVlcStreamUrl(streamUrl: string): string {
  return `vlc://${streamUrl}`;
}
