// API response types
import type { Anime, EpisodeInfo } from "./anime";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}

export interface LatestReleasesResponse {
  data: {
    anime_title: string;
    anime_uuid: string;
    episode: number;
    poster: string | null;
    fansub: string;
    created_at: string;
    mal_id: number | null;
    watch_url: string | null;
    type?: string;
    duration?: string;
  }[];
  total: number;
  current_page: number;
  last_page: number;
}

export interface AnimeRecommendation {
  mal_id: number;
  title: string;
  title_english?: string;
  images: Anime["images"];
  votes: number;
}

export interface AnimeCharacter {
  mal_id: number;
  name: string;
  images: { jpg?: { image_url?: string } };
  role: string;
  voice_actor?: {
    mal_id: number;
    name: string;
    images: { jpg?: { image_url?: string } };
  } | null;
}

export interface AnimepaheInfo {
  mal_id: number;
  title: string;
  match: { uuid: string; title: string };
  total_episodes: number;
}

export interface EpisodesResponse {
  mal_id: number;
  total: number;
  episodes: EpisodeInfo[];
}

export interface ExtractedVideo {
  embed: string;
  video: string;
}
