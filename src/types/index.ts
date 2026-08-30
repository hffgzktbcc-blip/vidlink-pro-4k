export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  runtime?: number;
  vote_average: number;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date?: string;
  episodes?: Episode[];
}

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: MediaType;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline?: string;
  status?: string;
  credits?: {
    cast: CastMember[];
  };
  videos?: {
    results: VideoItem[];
  };
  seasons?: Season[];
  similar?: {
    results: MediaItem[];
  };
  recommendations?: {
    results: MediaItem[];
  };
  is4K?: boolean;
}

export interface WatchHistoryItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  season?: number;
  episode?: number;
  timestamp: number;
  progressPercent: number;
  lastUpdated: string;
}

export interface ServerOption {
  id: string;
  name: string;
  quality: '4K Ultra HD' | '1080p Ultra' | 'Fast HD';
  badge: string;
  isPrimary?: boolean;
  pingMs?: number;
  getUrl: (
    id: number,
    type: MediaType,
    season?: number,
    episode?: number,
    accentColor?: string,
    subLang?: string
  ) => string;
}

export interface UniverseCollection {
  id: string;
  name: string;
  tagline: string;
  bannerUrl: string;
  accentColor: string;
  items: MediaItem[];
}

export type ActiveTab = 'home' | 'movies' | 'tv' | '4k' | 'universes' | 'trending' | 'watchlist';
