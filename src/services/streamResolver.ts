import type { MediaType } from '../types';

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
 * Resolves direct HLS (.m3u8) video streams for movies and TV episodes.
 * If a direct stream is available, Native TV Player plays it with 100% remote D-Pad controls.
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

  const streams: DirectStream[] = [];

  // 1. Attempt to fetch direct HLS streams from our serverless resolver / API
  try {
    const apiUrl = `/api/stream?id=${tmdbId}&type=${type}&s=${season}&e=${episode}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.streams) && data.streams.length > 0) {
        streams.push(...data.streams);
      }
    }
  } catch {
    // API resolution failed or timed out, will check secondary or fallback
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
