"""
Animepahe Latest Releases
=========================

Latest episode releases with MAL ID resolution.
"""

import asyncio
import logging
from typing import TYPE_CHECKING, Optional

from app.core.config import settings
from app.utils.matching import fuzzy_score

if TYPE_CHECKING:
    from app.scrapers.animepahe.client import AnimepaheScraper

logger = logging.getLogger(__name__)

# Cache for anime title -> MAL ID mapping
_mal_id_cache: dict[str, tuple] = {}


async def _search_mal_id(
    title: str,
) -> tuple[Optional[int], Optional[str], Optional[str], Optional[str]]:
    """Search for MAL ID using anime title."""
    from app.scrapers.jikan import search_anime

    cache_key = title.lower().strip()
    if cache_key in _mal_id_cache:
        return _mal_id_cache[cache_key]

    try:
        results, _ = await search_anime(title, page=1, limit=5)
        if not results:
            return None, None, None, None

        # Find best match
        best_match = results[0]
        best_score = 0.0

        for anime in results:
            anime_title = anime.get("title", "")
            if anime_title.lower() == title.lower():
                mal_id = anime["mal_id"]
                poster = anime.get("images", {}).get("jpg", {}).get("large_image_url")
                anime_type = anime.get("type")
                duration = anime.get("duration")
                _mal_id_cache[cache_key] = (mal_id, poster, anime_type, duration)
                return mal_id, poster, anime_type, duration

            score = fuzzy_score(anime_title, title)
            if score > best_score:
                best_score = score
                best_match = anime

        mal_id = best_match["mal_id"]
        poster = best_match.get("images", {}).get("jpg", {}).get("large_image_url")
        anime_type = best_match.get("type")
        duration = best_match.get("duration")
        _mal_id_cache[cache_key] = (mal_id, poster, anime_type, duration)
        return mal_id, poster, anime_type, duration

    except Exception as e:
        logger.error("MAL search error for '%s': %s", title, e)
        return None, None, None, None


async def get_latest_releases(scraper: "AnimepaheScraper", page: int = 1, limit: int = 12) -> dict:
    """
    Get latest episode releases with MAL IDs.

    Args:
        scraper: Animepahe scraper instance
        page: Page number
        limit: Max results

    Returns:
        Dict with releases and pagination
    """
    try:
        resp = await scraper.request(f"{settings.ANIMEPAHE_API_URL}?m=airing&page={page}")
        resp.raise_for_status()
        data = resp.json()

        releases = []
        items = data.get("data", [])[:limit]

        async def process_item(item):
            title = item.get("anime_title", "")
            mal_id, poster, anime_type, duration = await _search_mal_id(title)

            return {
                "anime_title": title,
                "anime_uuid": item.get("anime_session"),
                "episode": item.get("episode"),
                "poster": poster,
                "fansub": item.get("fansub"),
                "created_at": item.get("created_at"),
                "mal_id": mal_id,
                "watch_url": f"/watch/{mal_id}/{item.get('episode')}" if mal_id else None,
                "type": anime_type,
                "duration": duration,
            }

        # Process in batches
        batch_size = 4
        for i in range(0, len(items), batch_size):
            batch = items[i : i + batch_size]
            results = await asyncio.gather(*[process_item(item) for item in batch])
            releases.extend(results)
            if i + batch_size < len(items):
                await asyncio.sleep(0.5)

        return {
            "total": data.get("total", 0),
            "current_page": data.get("current_page", 1),
            "last_page": data.get("last_page", 1),
            "data": releases,
        }
    except Exception as e:
        logger.error("Latest releases error: %s", e)
        return {"total": 0, "current_page": 1, "last_page": 1, "data": []}
