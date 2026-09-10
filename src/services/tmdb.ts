import axios from 'axios';
import type { MediaItem, MediaType, Season } from '../types';
import {
  MOCK_HERO_ITEMS,
  MOCK_TRENDING_MOVIES,
  MOCK_TRENDING_TV,
  MOCK_4K_COLLECTION,
} from '../data/mockCatalog';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const STORAGE_KEY = 'vidlink_tmdb_api_key';

interface TrendingCache {
  updatedAt: string;
  trendingMovies: MediaItem[];
  trendingTV: MediaItem[];
  popularMovies: MediaItem[];
  popularTV: MediaItem[];
  top4KList: MediaItem[];
}

let memoryTrendingCache: TrendingCache | null = null;
let cacheLoadAttempted = false;

export const loadTrendingCache = async (): Promise<TrendingCache | null> => {
  if (memoryTrendingCache) return memoryTrendingCache;
  if (cacheLoadAttempted) return null;
  cacheLoadAttempted = true;

  try {
    const res = await fetch('/data/trending-cache.json');
    if (res.ok) {
      const data = await res.json();
      memoryTrendingCache = data;
      return data;
    }
  } catch {
    // Silent failover to dynamic TMDB or mockCatalog
  }
  return null;
};

// Initiate non-blocking background prefetch
if (typeof window !== 'undefined') {
  loadTrendingCache().catch(() => {});
}

export const getStoredApiKey = (): string => {
  return localStorage.getItem(STORAGE_KEY) || (import.meta.env.VITE_TMDB_API_KEY as string) || '';
};

export const setStoredApiKey = (key: string): void => {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const getImageUrl = (path: string | null | undefined, size: 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
  }
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null | undefined, size: 'w780' | 'w1280' | 'original' = 'original'): string => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1600&auto=format&fit=crop&q=80&ixlib=rb-4.0.3';
  }
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

const createTmdbClient = () => {
  const apiKey = getStoredApiKey();
  return axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
      api_key: apiKey || '4e44d9029b1270a757cddc766a1bcb63',
      language: 'en-US',
    },
    timeout: 8000,
  });
};

export const fetchHeroFeatured = async (): Promise<MediaItem[]> => {
  try {
    const client = createTmdbClient();
    const res = await client.get('/trending/all/day');
    if (res.data?.results?.length) {
      return res.data.results.slice(0, 8).map((item: any) => ({
        ...item,
        media_type: item.media_type || (item.title ? 'movie' : 'tv'),
        is4K: true,
      }));
    }
  } catch (err) {
    console.warn('Using fallback hero items', err);
  }
  return MOCK_HERO_ITEMS;
};

export const fetchTrending = async (type: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> => {
  // If memory cache is available, provide zero-latency immediate response
  if (!memoryTrendingCache) {
    await loadTrendingCache();
  }
  if (memoryTrendingCache) {
    if (type === 'movie' && memoryTrendingCache.trendingMovies?.length) {
      return memoryTrendingCache.trendingMovies;
    }
    if (type === 'tv' && memoryTrendingCache.trendingTV?.length) {
      return memoryTrendingCache.trendingTV;
    }
    if (type === 'all' && (memoryTrendingCache.trendingMovies?.length || memoryTrendingCache.trendingTV?.length)) {
      return [...(memoryTrendingCache.trendingMovies || []), ...(memoryTrendingCache.trendingTV || [])];
    }
  }

  try {
    const client = createTmdbClient();
    const res = await client.get(`/trending/${type}/${timeWindow}`);
    if (res.data?.results?.length) {
      return res.data.results.map((item: any) => ({
        ...item,
        media_type: type === 'all' ? item.media_type || (item.title ? 'movie' : 'tv') : type,
        is4K: Math.random() > 0.3,
      }));
    }
  } catch (err) {
    console.warn('Fallback trending', err);
  }
  return type === 'tv' ? MOCK_TRENDING_TV : MOCK_TRENDING_MOVIES;
};

export const fetchPopularMovies = async (page = 1): Promise<MediaItem[]> => {
  if (page === 1) {
    if (!memoryTrendingCache) await loadTrendingCache();
    if (memoryTrendingCache?.popularMovies?.length) {
      return memoryTrendingCache.popularMovies;
    }
  }

  try {
    const client = createTmdbClient();
    const res = await client.get('/movie/popular', { params: { page } });
    if (res.data?.results?.length) {
      return res.data.results.map((item: any) => ({
        ...item,
        media_type: 'movie' as MediaType,
        is4K: true,
      }));
    }
  } catch (err) {
    console.warn('Fallback popular movies', err);
  }
  return MOCK_TRENDING_MOVIES;
};

export const fetchTopRatedMovies = async (page = 1): Promise<MediaItem[]> => {
  try {
    const client = createTmdbClient();
    const res = await client.get('/movie/top_rated', { params: { page } });
    if (res.data?.results?.length) {
      return res.data.results.map((item: any) => ({
        ...item,
        media_type: 'movie' as MediaType,
        is4K: true,
      }));
    }
  } catch (err) {
    console.warn('Fallback top rated', err);
  }
  return MOCK_TRENDING_MOVIES;
};

export const fetchPopularTV = async (page = 1): Promise<MediaItem[]> => {
  if (page === 1) {
    if (!memoryTrendingCache) await loadTrendingCache();
    if (memoryTrendingCache?.popularTV?.length) {
      return memoryTrendingCache.popularTV;
    }
  }

  try {
    const client = createTmdbClient();
    const res = await client.get('/tv/popular', { params: { page } });
    if (res.data?.results?.length) {
      return res.data.results.map((item: any) => ({
        ...item,
        media_type: 'tv' as MediaType,
        is4K: true,
      }));
    }
  } catch (err) {
    console.warn('Fallback popular tv', err);
  }
  return MOCK_TRENDING_TV;
};

export const fetchTopRatedTV = async (page = 1): Promise<MediaItem[]> => {
  try {
    const client = createTmdbClient();
    const res = await client.get('/tv/top_rated', { params: { page } });
    if (res.data?.results?.length) {
      return res.data.results.map((item: any) => ({
        ...item,
        media_type: 'tv' as MediaType,
        is4K: true,
      }));
    }
  } catch (err) {
    console.warn('Fallback top rated tv', err);
  }
  return MOCK_TRENDING_TV;
};

export const fetch4KCollection = async (): Promise<MediaItem[]> => {
  if (!memoryTrendingCache) await loadTrendingCache();
  if (memoryTrendingCache?.top4KList?.length) {
    return memoryTrendingCache.top4KList;
  }

  try {
    const client = createTmdbClient();
    const [moviesRes, tvRes] = await Promise.all([
      client.get('/movie/top_rated', { params: { page: 1 } }),
      client.get('/tv/top_rated', { params: { page: 1 } }),
    ]);

    const movies = (moviesRes.data?.results || []).map((m: any) => ({ ...m, media_type: 'movie' as MediaType, is4K: true }));
    const tv = (tvRes.data?.results || []).map((t: any) => ({ ...t, media_type: 'tv' as MediaType, is4K: true }));
    return [...movies.slice(0, 10), ...tv.slice(0, 10)];
  } catch (err) {
    console.warn('Fallback 4k collection', err);
  }
  return MOCK_4K_COLLECTION;
};

export const fetchByGenre = async (genreId: number, type: MediaType = 'movie', page = 1): Promise<MediaItem[]> => {
  try {
    const client = createTmdbClient();
    const res = await client.get(`/discover/${type}`, {
      params: {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc',
      },
    });
    if (res.data?.results?.length) {
      return res.data.results.map((item: any) => ({
        ...item,
        media_type: type,
        is4K: Math.random() > 0.4,
      }));
    }
  } catch (err) {
    console.warn('Fallback genre search', err);
  }
  return (type === 'tv' ? MOCK_TRENDING_TV : MOCK_TRENDING_MOVIES).filter(m => m.genre_ids?.includes(genreId));
};

export const searchMedia = async (query: string, type: 'all' | 'movie' | 'tv' = 'all', page = 1): Promise<MediaItem[]> => {
  if (!query.trim()) return [];
  try {
    const client = createTmdbClient();
    const endpoint = type === 'all' ? '/search/multi' : `/search/${type}`;
    const res = await client.get(endpoint, {
      params: {
        query: encodeURIComponent(query.trim()),
        page,
        include_adult: false,
      },
    });
    if (res.data?.results?.length) {
      return res.data.results
        .filter((item: any) => item.media_type !== 'person' && (item.poster_path || item.backdrop_path))
        .map((item: any) => ({
          ...item,
          media_type: (item.media_type as MediaType) || (item.title ? 'movie' : 'tv'),
          is4K: true,
        }));
    }
  } catch (err) {
    console.warn('Fallback search query', err);
  }

  const cleanQ = query.toLowerCase();
  const allMock = [...MOCK_TRENDING_MOVIES, ...MOCK_TRENDING_TV];
  return allMock.filter(item => {
    const title = (item.title || item.name || '').toLowerCase();
    const overview = (item.overview || '').toLowerCase();
    return title.includes(cleanQ) || overview.includes(cleanQ);
  });
};

export const fetchMediaDetails = async (type: MediaType, id: number): Promise<MediaItem> => {
  try {
    const client = createTmdbClient();
    const res = await client.get(`/${type}/${id}`, {
      params: {
        append_to_response: 'credits,videos,similar,recommendations',
      },
    });
    if (res.data) {
      return {
        ...res.data,
        media_type: type,
        is4K: true,
      };
    }
  } catch (err) {
    console.warn('Fallback details fetch', err);
  }

  const found = [...MOCK_HERO_ITEMS, ...MOCK_TRENDING_MOVIES, ...MOCK_TRENDING_TV].find(m => m.id === id);
  if (found) return found;

  return {
    id,
    title: type === 'movie' ? 'Featured Movie' : undefined,
    name: type === 'tv' ? 'Featured Series' : undefined,
    media_type: type,
    overview: 'High definition streaming available in 4K Ultra HD with crystal clear surround sound and multi-language subtitles.',
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.0,
    vote_count: 1000,
    is4K: true,
  };
};

export const fetchSeasonDetails = async (tvId: number, seasonNumber: number): Promise<Season | null> => {
  try {
    const client = createTmdbClient();
    const res = await client.get(`/tv/${tvId}/season/${seasonNumber}`);
    if (res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('Fallback season fetch', err);
  }

  return {
    id: seasonNumber,
    name: `Season ${seasonNumber}`,
    season_number: seasonNumber,
    episode_count: 8,
    overview: `Season ${seasonNumber} episodes and story arc.`,
    poster_path: null,
    episodes: Array.from({ length: 8 }).map((_, idx) => ({
      id: tvId * 100 + seasonNumber * 10 + idx + 1,
      episode_number: idx + 1,
      season_number: seasonNumber,
      name: `Episode ${idx + 1}`,
      overview: `Streaming episode ${idx + 1} with high bitrate 4K video stream and Dolby Audio.`,
      still_path: null,
      air_date: '2024-01-01',
      vote_average: 8.2,
      runtime: 52,
    })),
  };
};
