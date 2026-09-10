import fs from 'node:fs';
import path from 'node:path';

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  is4K?: boolean;
}

interface TrendingCachePayload {
  updatedAt: string;
  trendingMovies: MediaItem[];
  trendingTV: MediaItem[];
  popularMovies: MediaItem[];
  popularTV: MediaItem[];
  top4KList: MediaItem[];
}

const TMDB_KEY = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({
    api_key: TMDB_KEY,
    language: 'en-US',
    ...params,
  });
  const res = await fetch(`${BASE_URL}${endpoint}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`TMDB HTTP ${res.status}: ${res.statusText} for ${endpoint}`);
  }
  return res.json();
}

async function main() {
  console.log('🚀 Fetching fresh TMDB trending and 4K catalogs for offline/instant cache...');

  try {
    const [
      trendingMoviesData,
      trendingTVData,
      popularMoviesData,
      popularTVData,
      topRatedMoviesData,
      topRatedTVData,
    ] = await Promise.all([
      fetchTMDB('/trending/movie/week'),
      fetchTMDB('/trending/tv/week'),
      fetchTMDB('/movie/popular', { page: '1' }),
      fetchTMDB('/tv/popular', { page: '1' }),
      fetchTMDB('/movie/top_rated', { page: '1' }),
      fetchTMDB('/tv/top_rated', { page: '1' }),
    ]);

    const trendingMovies: MediaItem[] = (trendingMoviesData.results || []).map((m: any) => ({
      ...m,
      media_type: 'movie' as const,
      is4K: true,
    }));

    const trendingTV: MediaItem[] = (trendingTVData.results || []).map((t: any) => ({
      ...t,
      media_type: 'tv' as const,
      is4K: true,
    }));

    const popularMovies: MediaItem[] = (popularMoviesData.results || []).map((m: any) => ({
      ...m,
      media_type: 'movie' as const,
      is4K: true,
    }));

    const popularTV: MediaItem[] = (popularTVData.results || []).map((t: any) => ({
      ...t,
      media_type: 'tv' as const,
      is4K: true,
    }));

    const top4KList: MediaItem[] = [
      ...(topRatedMoviesData.results || []).slice(0, 10).map((m: any) => ({ ...m, media_type: 'movie' as const, is4K: true })),
      ...(topRatedTVData.results || []).slice(0, 10).map((t: any) => ({ ...t, media_type: 'tv' as const, is4K: true })),
    ];

    const payload: TrendingCachePayload = {
      updatedAt: new Date().toISOString(),
      trendingMovies,
      trendingTV,
      popularMovies,
      popularTV,
      top4KList,
    };

    const outDir = path.resolve(process.cwd(), 'public/data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const targetFile = path.join(outDir, 'trending-cache.json');
    fs.writeFileSync(targetFile, JSON.stringify(payload, null, 2), 'utf-8');

    console.log(`✅ Successfully generated trending cache: ${targetFile}`);
    console.log(`📊 Stats: ${trendingMovies.length} trending movies, ${trendingTV.length} trending TV shows, ${top4KList.length} 4K items.`);
  } catch (error) {
    console.error('❌ Failed to fetch TMDB trending cache:', error);
    process.exit(1);
  }
}

main();
