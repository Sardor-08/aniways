"""
Jikan API Client
================

Wrapper for the Jikan API (MyAnimeList data).

Features:
    - Rate limiting (3 requests/second)
    - Caching with configurable TTL
    - Automatic retries
"""

import asyncio
import logging
import time
from typing import Any

from app.core.config import settings
from app.core.dependencies import get_client

logger = logging.getLogger(__name__)

# Rate limiting
_last_request_time = 0.0
_rate_limit_lock = asyncio.Lock()

# Cache
_cache: dict[str, tuple[float, Any]] = {}

CACHE_TTL = {
    "top": settings.CACHE_TTL_TOP,
    "seasonal": settings.CACHE_TTL_SEASONAL,
    "anime": settings.CACHE_TTL_ANIME,
    "episodes": settings.CACHE_TTL_EPISODES,
    "search": settings.CACHE_TTL_SEARCH,
}


def _get_cache(key: str, ttl_type: str) -> Any | None:
    if key in _cache:
        cached_time, value = _cache[key]
        if time.time() - cached_time < CACHE_TTL.get(ttl_type, 300):
            return value
        del _cache[key]
    return None


def _set_cache(key: str, value: Any) -> None:
    _cache[key] = (time.time(), value)


# =============================================================================
# API Request
# =============================================================================


async def jikan_request(
    endpoint: str,
    params: dict | None = None,
    max_retries: int = settings.JIKAN_MAX_RETRIES,
) -> dict | None:
    """Make request to Jikan API with rate limiting."""
    global _last_request_time

    for attempt in range(max_retries):
        async with _rate_limit_lock:
            now = time.time()
            elapsed = now - _last_request_time
            if elapsed < settings.JIKAN_RATE_LIMIT_DELAY:
                await asyncio.sleep(settings.JIKAN_RATE_LIMIT_DELAY - elapsed)
            _last_request_time = time.time()

        client = get_client()
        url = f"{settings.JIKAN_BASE_URL}{endpoint}"

        try:
            response = await client.get(url, params=params, follow_redirects=True)

            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 1))
                logger.warning("Rate limited, waiting %ds", retry_after)
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_after)
                    continue
                return None

            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.warning("Jikan error (attempt %d): %s", attempt + 1, e)
            if attempt < max_retries - 1:
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            return None

    return None


# =============================================================================
# Data Normalization
# =============================================================================


def _normalize_anime(anime: dict) -> dict:
    """Normalize Jikan anime response."""
    images = anime.get("images", {})
    jpg = images.get("jpg", {})
    webp = images.get("webp", {})

    return {
        "mal_id": anime.get("mal_id"),
        "url": anime.get("url"),
        "title": anime.get("title"),
        "title_english": anime.get("title_english"),
        "title_japanese": anime.get("title_japanese"),
        "title_synonyms": anime.get("title_synonyms", []),
        "images": {
            "jpg": {
                "image_url": jpg.get("image_url"),
                "small_image_url": jpg.get("small_image_url"),
                "large_image_url": jpg.get("large_image_url"),
            },
            "webp": {
                "image_url": webp.get("image_url"),
                "small_image_url": webp.get("small_image_url"),
                "large_image_url": webp.get("large_image_url"),
            },
        },
        "type": anime.get("type"),
        "source": anime.get("source"),
        "episodes": anime.get("episodes"),
        "status": anime.get("status"),
        "airing": anime.get("airing"),
        "aired": anime.get("aired"),
        "duration": anime.get("duration"),
        "rating": anime.get("rating"),
        "score": anime.get("score"),
        "scored_by": anime.get("scored_by"),
        "rank": anime.get("rank"),
        "popularity": anime.get("popularity"),
        "members": anime.get("members"),
        "favorites": anime.get("favorites"),
        "synopsis": anime.get("synopsis"),
        "background": anime.get("background"),
        "season": anime.get("season"),
        "year": anime.get("year"),
        "broadcast": anime.get("broadcast"),
        "producers": anime.get("producers", []),
        "licensors": anime.get("licensors", []),
        "studios": anime.get("studios", []),
        "genres": anime.get("genres", []),
        "themes": anime.get("themes", []),
        "demographics": anime.get("demographics", []),
        "relations": anime.get("relations", []),
        "streaming": anime.get("streaming", []),
    }


# =============================================================================
# Top Anime
# =============================================================================


async def scrape_top_anime(
    filter_type: str = "airing", limit: int = 10, anime_type: str = None, page: int = 1
) -> dict:
    """Get top anime from Jikan API."""
    cache_key = f"top:{filter_type}:{anime_type}:{limit}:{page}"
    cached = _get_cache(cache_key, "top")
    if cached:
        return cached

    filter_map = {
        "airing": "airing",
        "upcoming": "upcoming",
        "bypopularity": "bypopularity",
        "favorite": "favorite",
        "": None,
    }

    params = {"limit": min(limit, 25), "page": page}
    jikan_filter = filter_map.get(filter_type)
    if jikan_filter:
        params["filter"] = jikan_filter

    valid_types = ["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"]
    if anime_type and anime_type.lower() in valid_types:
        params["type"] = anime_type.lower()

    result = await jikan_request("/top/anime", params)
    if not result or "data" not in result:
        return {"data": [], "pagination": {"last_visible_page": 1, "has_next_page": False}}

    anime_list = [_normalize_anime(a) for a in result["data"][:limit]]
    pagination = result.get("pagination", {})

    response = {
        "data": anime_list,
        "pagination": {
            "last_visible_page": pagination.get("last_visible_page", 1),
            "has_next_page": pagination.get("has_next_page", False),
        },
    }

    _set_cache(cache_key, response)
    return response


# =============================================================================
# Anime Details
# =============================================================================


async def scrape_anime_details(mal_id: int) -> dict | None:
    """Get full anime details."""
    cache_key = f"anime:{mal_id}"
    cached = _get_cache(cache_key, "anime")
    if cached:
        return cached

    result = await jikan_request(f"/anime/{mal_id}/full")
    if not result or "data" not in result:
        return None

    anime = _normalize_anime(result["data"])
    _set_cache(cache_key, anime)
    return anime


# =============================================================================
# Browse
# =============================================================================


async def browse_anime(
    status: str = None,
    order_by: str = None,
    sort: str = "desc",
    page: int = 1,
    limit: int = 25,
) -> dict:
    """Browse anime with filters."""
    cache_key = f"browse:{status}:{order_by}:{sort}:{page}:{limit}"
    cached = _get_cache(cache_key, "search")
    if cached:
        return cached

    params = {"page": page, "limit": min(limit, 25), "sfw": "false"}

    valid_statuses = ["airing", "complete", "upcoming"]
    if status and status.lower() in valid_statuses:
        params["status"] = status.lower()

    valid_order_by = ["score", "popularity", "start_date", "rank", "members"]
    if order_by and order_by.lower() in valid_order_by:
        params["order_by"] = order_by.lower()
        params["sort"] = "asc" if sort == "asc" else "desc"

    result = await jikan_request("/anime", params)
    if not result or "data" not in result:
        return {"data": [], "pagination": {"last_visible_page": 1, "has_next_page": False}}

    anime_list = [_normalize_anime(a) for a in result["data"]]
    pagination = result.get("pagination", {})

    response = {
        "data": anime_list,
        "pagination": {
            "last_visible_page": pagination.get("last_visible_page", 1),
            "has_next_page": pagination.get("has_next_page", False),
        },
    }

    _set_cache(cache_key, response)
    return response


# =============================================================================
# Search
# =============================================================================


async def search_anime(query: str, page: int = 1, limit: int = 25) -> tuple[list[dict], int]:
    """Search anime."""
    cache_key = f"search:{query}:{page}:{limit}"
    cached = _get_cache(cache_key, "search")
    if cached:
        return cached

    params = {"q": query, "page": page, "limit": min(limit, 25), "sfw": "false"}

    result = await jikan_request("/anime", params)
    if not result or "data" not in result:
        return [], 1

    anime_list = [_normalize_anime(a) for a in result["data"]]
    pagination = result.get("pagination", {})
    total_pages = pagination.get("last_visible_page", 1)

    response = (anime_list, total_pages)
    _set_cache(cache_key, response)
    return response


# =============================================================================
# Seasonal
# =============================================================================


async def scrape_seasonal_anime(year: int = None, season: str = None, limit: int = 25) -> list[dict]:
    """Get seasonal anime."""
    if year and season:
        cache_key = f"seasonal:{year}:{season}:{limit}"
        endpoint = f"/seasons/{year}/{season}"
    else:
        cache_key = f"seasonal:now:{limit}"
        endpoint = "/seasons/now"

    cached = _get_cache(cache_key, "seasonal")
    if cached:
        return cached

    params = {"limit": min(limit, 25)}
    result = await jikan_request(endpoint, params)
    if not result or "data" not in result:
        return []

    anime_list = [_normalize_anime(a) for a in result["data"][:limit]]
    _set_cache(cache_key, anime_list)
    return anime_list


async def scrape_upcoming_anime(limit: int = 25) -> list[dict]:
    """Get upcoming anime."""
    cache_key = f"seasonal:upcoming:{limit}"
    cached = _get_cache(cache_key, "seasonal")
    if cached:
        return cached

    params = {"limit": min(limit, 25)}
    result = await jikan_request("/seasons/upcoming", params)
    if not result or "data" not in result:
        return []

    anime_list = [_normalize_anime(a) for a in result["data"][:limit]]
    _set_cache(cache_key, anime_list)
    return anime_list


# =============================================================================
# Schedule
# =============================================================================


async def scrape_schedule(day: str = None, page: int = 1) -> list[dict]:
    """Get weekly schedule."""
    cache_key = f"schedule:{day or 'all'}:{page}"
    cached = _get_cache(cache_key, "seasonal")
    if cached:
        return cached

    params = {"page": page, "sfw": "true"}
    if day:
        params["filter"] = day

    result = await jikan_request("/schedules", params)
    if not result or "data" not in result:
        return []

    anime_list = [_normalize_anime(a) for a in result["data"]]
    _set_cache(cache_key, anime_list)
    return anime_list


# =============================================================================
# Episodes
# =============================================================================


async def scrape_episode(mal_id: int, episode_num: int) -> dict | None:
    """Get specific episode info."""
    cache_key = f"episode:{mal_id}:{episode_num}"
    cached = _get_cache(cache_key, "episodes")
    if cached:
        return cached

    result = await jikan_request(f"/anime/{mal_id}/episodes/{episode_num}")
    if not result or "data" not in result:
        return None

    ep = result["data"]
    episode = {
        "mal_id": ep.get("mal_id"),
        "episode": episode_num,
        "title": ep.get("title"),
        "title_japanese": ep.get("title_japanese"),
        "title_romanji": ep.get("title_romanji"),
        "aired": ep.get("aired"),
        "filler": ep.get("filler", False),
        "recap": ep.get("recap", False),
    }

    _set_cache(cache_key, episode)
    return episode


async def scrape_all_episodes(mal_id: int) -> list[dict]:
    """Get all episodes."""
    cache_key = f"episodes:{mal_id}"
    cached = _get_cache(cache_key, "episodes")
    if cached:
        return cached

    all_episodes = []
    page = 1

    while page <= 10:
        result = await jikan_request(f"/anime/{mal_id}/episodes", {"page": page})
        if not result or "data" not in result:
            break

        episodes = result["data"]
        if not episodes:
            break

        for ep in episodes:
            all_episodes.append({
                "mal_id": ep.get("mal_id"),
                "episode": ep.get("mal_id"),
                "title": ep.get("title"),
                "title_japanese": ep.get("title_japanese"),
                "title_romanji": ep.get("title_romanji"),
                "aired": ep.get("aired"),
                "filler": ep.get("filler", False),
                "recap": ep.get("recap", False),
            })

        pagination = result.get("pagination", {})
        if not pagination.get("has_next_page", False):
            break
        page += 1

    _set_cache(cache_key, all_episodes)
    return all_episodes


# =============================================================================
# Recommendations
# =============================================================================


async def scrape_recommendations(mal_id: int, limit: int = 12) -> list[dict]:
    """Get anime recommendations."""
    cache_key = f"recommendations:{mal_id}:{limit}"
    cached = _get_cache(cache_key, "anime")
    if cached:
        return cached

    result = await jikan_request(f"/anime/{mal_id}/recommendations")
    if not result or "data" not in result:
        return []

    recommendations = []
    for rec in result["data"][:limit]:
        entry = rec.get("entry", {})
        if entry:
            recommendations.append({
                "mal_id": entry.get("mal_id"),
                "title": entry.get("title"),
                "title_english": entry.get("title_english"),
                "images": entry.get("images", {}),
                "votes": rec.get("votes", 0),
            })

    _set_cache(cache_key, recommendations)
    return recommendations


# =============================================================================
# Characters
# =============================================================================


async def scrape_characters(mal_id: int, limit: int = 12) -> list[dict]:
    """Get anime characters with voice actors."""
    cache_key = f"characters:{mal_id}:{limit}"
    cached = _get_cache(cache_key, "anime")
    if cached:
        return cached

    result = await jikan_request(f"/anime/{mal_id}/characters")
    if not result or "data" not in result:
        return []

    characters = []
    for char in result["data"][:limit]:
        character = char.get("character", {})
        voice_actors = char.get("voice_actors", [])

        japanese_va = None
        for va in voice_actors:
            if va.get("language") == "Japanese":
                japanese_va = {
                    "mal_id": va.get("person", {}).get("mal_id"),
                    "name": va.get("person", {}).get("name"),
                    "images": va.get("person", {}).get("images", {}),
                }
                break

        characters.append({
            "mal_id": character.get("mal_id"),
            "name": character.get("name"),
            "images": character.get("images", {}),
            "role": char.get("role"),
            "voice_actor": japanese_va,
        })

    _set_cache(cache_key, characters)
    return characters


# Backwards compatibility exports
class JikanClient:
    """Backwards compatibility wrapper."""

    scrape_top_anime = staticmethod(scrape_top_anime)
    scrape_anime_details = staticmethod(scrape_anime_details)
    browse_anime = staticmethod(browse_anime)
    search_anime = staticmethod(search_anime)
    scrape_seasonal_anime = staticmethod(scrape_seasonal_anime)
    scrape_upcoming_anime = staticmethod(scrape_upcoming_anime)
    scrape_schedule = staticmethod(scrape_schedule)
    scrape_episode = staticmethod(scrape_episode)
    scrape_all_episodes = staticmethod(scrape_all_episodes)
    scrape_recommendations = staticmethod(scrape_recommendations)
    scrape_characters = staticmethod(scrape_characters)
