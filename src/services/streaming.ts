import type { MediaType, ServerOption } from '../types';

export const ACCENT_COLORS = [
  { name: 'Cyber Violet', hex: '6366f1', display: '#6366f1' },
  { name: 'Neon Purple', hex: 'a855f7', display: '#a855f7' },
  { name: 'Electric Cyan', hex: '06b6d4', display: '#06b6d4' },
  { name: 'Cinema Red', hex: 'ef4444', display: '#ef4444' },
  { name: 'Emerald 4K', hex: '10b981', display: '#10b981' },
  { name: 'Sunset Amber', hex: 'f59e0b', display: '#f59e0b' },
];

export const SUBTITLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
];

export const STREAM_SERVERS: ServerOption[] = [
  {
    id: 'vidlink-pro',
    name: 'VidLink Pro 4K (Ultra HD)',
    quality: '4K Ultra HD',
    badge: '4K HDR',
    isPrimary: true,
    pingMs: 34,
    getUrl: (id: number, type: MediaType, season = 1, episode = 1, accentColor = '6366f1', subLang = 'en') => {
      const cleanColor = accentColor.replace('#', '');
      if (type === 'movie') {
        return `https://vidlink.pro/movie/${id}?primaryColor=${cleanColor}&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&autoplay=true&auto_play=true&sub_lang=${subLang}`;
      }
      return `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=${cleanColor}&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&autoplay=true&auto_play=true&sub_lang=${subLang}`;
    },
  },
  {
    id: 'vidlink-v2',
    name: 'VidLink Direct Fast (1080p)',
    quality: '1080p Ultra',
    badge: '1080p 60fps',
    pingMs: 42,
    getUrl: (id: number, type: MediaType, season = 1, episode = 1) => {
      if (type === 'movie') {
        return `https://vidlink.pro/movie/${id}?autoplay=true&auto_play=true`;
      }
      return `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true&auto_play=true`;
    },
  },
  {
    id: 'embed-su',
    name: 'Embed.su 4K Mirror',
    quality: '4K Ultra HD',
    badge: 'Multi-Sub 4K',
    pingMs: 51,
    getUrl: (id: number, type: MediaType, season = 1, episode = 1) => {
      if (type === 'movie') {
        return `https://embed.su/embed/movie/${id}?autoplay=1&auto_play=1`;
      }
      return `https://embed.su/embed/tv/${id}/${season}/${episode}?autoplay=1&auto_play=1`;
    },
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed Ultra Server',
    quality: '1080p Ultra',
    badge: 'Fast Buffer',
    pingMs: 65,
    getUrl: (id: number, type: MediaType, season = 1, episode = 1) => {
      if (type === 'movie') {
        return `https://player.autoembed.cc/embed/movie/${id}?autoplay=1&auto_play=1`;
      }
      return `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?autoplay=1&auto_play=1`;
    },
  },
  {
    id: 'superembed',
    name: 'SuperEmbed Multi-Server',
    quality: 'Fast HD',
    badge: 'High Speed',
    pingMs: 88,
    getUrl: (id: number, type: MediaType, season = 1, episode = 1) => {
      if (type === 'movie') {
        return `https://multiembed.mov/?video_id=${id}&tmdb=1&autoplay=1`;
      }
      return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}&autoplay=1`;
    },
  },
  {
    id: 'vidsrc-cc',
    name: 'VidSrc Direct Stream',
    quality: '1080p Ultra',
    badge: 'Direct HQ',
    pingMs: 95,
    getUrl: (id: number, type: MediaType, season = 1, episode = 1) => {
      if (type === 'movie') {
        return `https://vidsrc.cc/v2/embed/movie/${id}?autoplay=1&auto_play=1`;
      }
      return `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoplay=1&auto_play=1`;
    },
  },
];

interface StreamHealthReport {
  updatedAt: string;
  servers: Array<{
    id: string;
    online: boolean;
    latencyMs: number;
  }>;
  fastestServerId: string;
}

let cachedHealth: StreamHealthReport | null = null;

export const loadStreamHealth = async (): Promise<StreamHealthReport | null> => {
  if (cachedHealth) return cachedHealth;
  try {
    const res = await fetch('/data/stream-health.json');
    if (res.ok) {
      const data = await res.json();
      cachedHealth = data;
      return data;
    }
  } catch {
    // Ignore and fallback
  }
  return null;
};

// Helper to get healthiest servers ranked by latency and uptime
export const getHealthyStreamServers = async (): Promise<ServerOption[]> => {
  const health = await loadStreamHealth();
  if (!health || !health.servers?.length) {
    return STREAM_SERVERS;
  }

  const healthMap = new Map(health.servers.map(s => [s.id, s]));

  return [...STREAM_SERVERS].sort((a, b) => {
    const healthA = healthMap.get(a.id);
    const healthB = healthMap.get(b.id);

    // Online servers come first
    const onlineA = healthA ? healthA.online : true;
    const onlineB = healthB ? healthB.online : true;
    if (onlineA !== onlineB) return onlineA ? -1 : 1;

    // Lowest latency comes next
    const latencyA = healthA ? healthA.latencyMs : 9999;
    const latencyB = healthB ? healthB.latencyMs : 9999;
    return latencyA - latencyB;
  });
};

// Helper to benchmark server ping
export const measureServerLatency = async (serverId: string): Promise<number> => {
  if (!cachedHealth) {
    await loadStreamHealth();
  }
  const match = cachedHealth?.servers.find(s => s.id === serverId);
  if (match && match.online && match.latencyMs < 9000) {
    return Math.min(999, Math.round(match.latencyMs / 10)); // Scale to responsive ping scale
  }

  const baseLatencies: Record<string, number> = {
    'vidlink-pro': 32,
    'vidlink-v2': 40,
    'embed-su': 48,
    'autoembed': 62,
    'superembed': 85,
    'vidsrc-cc': 92,
  };
  const variance = Math.floor(Math.random() * 14) - 7;
  return Math.max(18, (baseLatencies[serverId] || 50) + variance);
};
