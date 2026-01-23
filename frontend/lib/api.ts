const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4444";

export interface Anime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: { large_image_url: string; image_url: string };
    webp: { large_image_url: string; image_url: string };
  };
  synopsis?: string;
  background?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  status?: string;
  rating?: string;
  episodes?: number;
  duration?: string;
  source?: string;
  aired?: { string: string; from?: string; to?: string };
  broadcast?: { string?: string; day?: string; time?: string; timezone?: string };
  season?: string;
  year?: number;
  studios?: { mal_id: number; name: string }[];
  producers?: { mal_id: number; name: string }[];
  licensors?: { mal_id: number; name: string }[];
  genres?: { mal_id: number; name: string }[];
  themes?: { mal_id: number; name: string }[];
  demographics?: { mal_id: number; name: string }[];
  type?: string;
  airing?: boolean;
  relations?: {
    relation: string;
    entry: { mal_id: number; type: string; name: string; url: string }[];
  }[];
}

export interface Episode {
  episode: number;
  session: string;
  snapshot?: string;
  filler?: boolean;
  created_at?: string;
}

export interface VideoSource {
  embed_url: string;
  fansub: string;
  resolution: number;
  quality: string;
  audio: string;
  av1: boolean;
}

export interface EpisodeInfo {
  episode: number;
  title?: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
}

export interface WatchResponse {
  mal_id: number;
  title: string;
  episode: number;
  episode_info?: EpisodeInfo;
  uuid: string;
  session: string;
  snapshot?: string;
  sources: VideoSource[];
}

export interface AnimeEpisodesResponse {
  mal_id: number;
  title: string;
  uuid: string;
  total: number;
  episodes: {
    episode: number;
    session: string;
    snapshot?: string;
    sources: VideoSource[];
  }[];
}

async function fetchApi<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface LatestRelease {
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
}

// API endpoints (MAL Scraper + Animepahe)
export const api = {
  // Search anime
  searchAnime: (q: string, page = 1) =>
    fetchApi<{ data: Anime[]; pagination: { last_visible_page: number; has_next_page: boolean } }>("/api/anime", { q, page }),

  // Get anime details
  getAnime: (id: number) => fetchApi<{ data: Anime }>(`/api/anime/${id}`),
  getAnimeFull: (id: number) => fetchApi<{ data: Anime }>(`/api/anime/${id}/full`),
  
  // Get anime recommendations
  getRecommendations: (id: number, limit = 12) =>
    fetchApi<{ data: { mal_id: number; title: string; title_english?: string; images: Anime["images"]; votes: number }[] }>(`/api/anime/${id}/recommendations`, { limit }),

  // Get anime characters
  getCharacters: (id: number, limit = 12) =>
    fetchApi<{ data: { mal_id: number; name: string; images: { jpg?: { image_url?: string } }; role: string; voice_actor?: { mal_id: number; name: string; images: { jpg?: { image_url?: string } } } | null }[] }>(`/api/anime/${id}/characters`, { limit }),

  // Top anime lists
  getTopAnime: (filter = "airing", page = 1, limit = 24, type?: string) =>
    fetchApi<{ data: Anime[]; pagination: { last_visible_page: number; has_next_page: boolean } }>("/api/top/anime", { filter, page, limit, ...(type && { type }) }),
  
  // Browse anime with filters and sorting
  browseAnime: (params: { status?: string; order_by?: string; sort?: string; page?: number; limit?: number } = {}) =>
    fetchApi<{ data: Anime[]; pagination: { last_visible_page: number; has_next_page: boolean } }>("/api/browse/anime", {
      ...(params.status && { status: params.status }),
      ...(params.order_by && { order_by: params.order_by }),
      ...(params.sort && { sort: params.sort }),
      page: params.page || 1,
      limit: params.limit || 24,
    }),

  // Seasonal anime
  getCurrentSeason: (page = 1, limit = 24) =>
    fetchApi<{ data: Anime[]; pagination: { last_visible_page: number; has_next_page: boolean } }>("/api/seasons/now", { page, limit }),
  getUpcoming: (page = 1, limit = 24) =>
    fetchApi<{ data: Anime[]; pagination: { last_visible_page: number; has_next_page: boolean } }>("/api/seasons/upcoming", { page, limit }),
  getSeason: (year: number, season: string, page = 1, limit = 24) =>
    fetchApi<{ data: Anime[]; pagination: { last_visible_page: number; has_next_page: boolean } }>(`/api/seasons/${year}/${season}`, { page, limit }),

  // Latest releases from Animepahe
  getLatestReleases: (page = 1, limit = 12) =>
    fetchApi<{ data: LatestRelease[]; total: number; current_page: number; last_page: number }>("/api/animepahe/latest", { page, limit }),

  // Watch (Animepahe sources)
  getWatchSources: (malId: number, episode: number, quality = "1080") =>
    fetchApi<WatchResponse>(`/api/watch/${malId}/${episode}`, { quality }),

  // Get all episodes with sources
  getAllSources: (malId: number) =>
    fetchApi<AnimeEpisodesResponse>(`/api/anime/${malId}/sources`),

  // Get Animepahe info for MAL ID
  getAnimepaheInfo: (malId: number) =>
    fetchApi<{ mal_id: number; title: string; match: { uuid: string; title: string }; total_episodes: number }>(`/api/anime/${malId}/animepahe`),

  // Get all episode titles from MAL
  getEpisodes: (malId: number) =>
    fetchApi<{ mal_id: number; total: number; episodes: EpisodeInfo[] }>(`/api/anime/${malId}/episodes`),

  // Extract video URL
  extractVideo: (kwikUrl: string) =>
    fetchApi<{ embed: string; video: string }>("/api/animepahe/extract", { url: kwikUrl }),

  // Schedule
  getSchedule: (day?: string) =>
    fetchApi<{ data: Anime[]; pagination: { last_visible_page: number; has_next_page: boolean } }>("/api/schedules", day ? { filter: day } : {}),
};
