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

  return {
    directStreams: streams,
    defaultStream: streams[0],
    fallbackIframeUrl,
  };
}

/**
 * Helper to launch external Android TV player (Just Player / VLC / MX Player)
 * via native Android Intent using Capacitor
 */
export function openInExternalPlayer(streamUrl: string, title: string) {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const cap = (window as any).Capacitor;
    if (cap.isNativePlatform && cap.isNativePlatform()) {
      // In Android native, fire ACTION_VIEW intent with video/mp4 or application/x-mpegURL
      window.location.href = `intent:${streamUrl}#Intent;type=video/*;title=${encodeURIComponent(title)};end`;
      return true;
    }
  }

  // Web fallback: open direct stream URL in new tab
  window.open(streamUrl, '_blank');
  return false;
}
