"""
Animepahe Video Sources
=======================

Video source extraction functionality.
"""

import logging
import re
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from app.scrapers.animepahe.client import AnimepaheScraper

logger = logging.getLogger(__name__)


async def get_sources(scraper: "AnimepaheScraper", anime_uuid: str, episode_session: str) -> dict:
    """
    Get video sources for an episode.

    Args:
        scraper: Animepahe scraper instance
        anime_uuid: Animepahe anime UUID
        episode_session: Episode session ID

    Returns:
        Dict with video sources
    """
    try:
        url = f"{settings.ANIMEPAHE_BASE_URL}/play/{anime_uuid}/{episode_session}"
        resp = await scraper.request(url)
        resp.raise_for_status()
        html = resp.text

        # Parse sources from HTML
        pattern = r'data-src="([^"]+)"[^>]*data-fansub="([^"]*)"[^>]*data-resolution="(\d+)"[^>]*data-audio="([^"]*)"[^>]*data-av1="([^"]*)"'
        sources = sorted(
            [
                {
                    "embed_url": u,
                    "fansub": f,
                    "resolution": int(r),
                    "quality": f"{r}p",
                    "audio": a,
                    "av1": v == "1",
                }
                for u, f, r, a, v in re.findall(pattern, html, re.IGNORECASE)
            ],
            key=lambda x: x["resolution"],
            reverse=True,
        )

        return {"sources": sources, "episode_url": url}
    except Exception as e:
        logger.error("Sources error for %s/%s: %s", anime_uuid, episode_session, e)
        return {"sources": []}


async def get_video_url(
    scraper: "AnimepaheScraper", mal_id: int, episode: int, quality: str = "1080"
) -> dict:
    """
    Complete flow: MAL ID -> Animepahe search -> Episode -> Video URL.

    Args:
        scraper: Animepahe scraper instance
        mal_id: MyAnimeList anime ID
        episode: Episode number
        quality: Preferred quality

    Returns:
        Dict with video URL or error
    """
    from app.scrapers.jikan import scrape_anime_details
    from app.scrapers.animepahe.episodes import find_episode

    result = {"mal_id": mal_id, "episode": episode, "error": None}

    try:
        # Get anime from MAL
        anime = await scrape_anime_details(mal_id)
        if not anime:
            return {**result, "error": "Anime not found on MAL"}

        title, title_en = anime.get("title"), anime.get("title_english")
        result["mal_title"] = title

        # Search Animepahe
        results = await scraper.search(title) or (
            await scraper.search(title_en) if title_en else []
        )
        if not results:
            return {**result, "error": f"'{title}' not found on Animepahe"}

        match = scraper._best_match(results, title, title_en)
        result["anime_uuid"] = match["uuid"]
        result["animepahe_title"] = match["title"]

        # Find episode
        ep = await find_episode(scraper, match["uuid"], episode)
        if not ep:
            return {**result, "error": f"Episode {episode} not found"}

        result["episode_session"] = ep["session"]

        # Get sources
        sources_data = await get_sources(scraper, match["uuid"], ep["session"])
        sources = sources_data.get("sources", [])
        result["sources"] = sources
        if not sources:
            return {**result, "error": "No sources found"}

        # Select quality
        target = int(quality)
        source = next((s for s in sources if s["resolution"] == target), sources[0])
        result["selected_quality"] = source["quality"]
        result["embed_url"] = source["embed_url"]

        # Extract video URL
        result["video_url"] = await scraper.kwik.extract(source["embed_url"])
        if not result["video_url"]:
            result["error"] = "Could not extract video URL"

        return result
    except Exception as e:
        logger.exception("get_video_url error")
        return {**result, "error": str(e)}
