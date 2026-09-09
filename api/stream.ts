import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, type = 'movie', s = '1', e = '1', proxy } = req.query;

  // 1. Direct Stream Proxy (bypasses browser CORS for .m3u8 manifests & .ts segments)
  if (proxy && typeof proxy === 'string') {
    try {
      const targetUrl = decodeURIComponent(proxy);
      const upstream = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: new URL(targetUrl).origin,
        },
      });

      const contentType = upstream.headers.get('content-type') || 'application/vnd.apple.mpegurl';
      res.setHeader('Content-Type', contentType);

      const buffer = await upstream.arrayBuffer();
      return res.status(200).send(Buffer.from(buffer));
    } catch (err: any) {
      return res.status(500).json({ error: 'Proxy failed', message: err.message });
    }
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing tmdb id' });
  }

  const tmdbId = String(id);
  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const season = String(s);
  const episode = String(e);

  // 2. Stream Provider Extraction List
  const streams: Array<{
    url: string;
    quality: string;
    isM3U8: boolean;
    provider: string;
    headers?: Record<string, string>;
  }> = [];

  try {
    // Check multiple public stream resolvers / scrapers
    // Provider 1: VidSrc / 2Embed direct stream resolver
    const resolverUrls = [
      `https://vidsrc.me/embed/${mediaType === 'movie' ? `movie?tmdb=${tmdbId}` : `tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`}`,
    ];

    return res.status(200).json({
      tmdbId,
      mediaType,
      season,
      episode,
      streams,
      fallbackUrl:
        mediaType === 'movie'
          ? `https://vidlink.pro/movie/${tmdbId}?autoplay=true`
          : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?autoplay=true`,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Resolver error',
      message: err.message,
      streams: [],
      fallbackUrl: `https://vidlink.pro/${mediaType}/${tmdbId}?autoplay=true`,
    });
  }
}
