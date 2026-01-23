"""
Animepahe Episodes
==================

Episode listing functionality.
"""

import logging
import re
from typing import TYPE_CHECKING

from bs4 import BeautifulSoup

from app.core.config import settings

if TYPE_CHECKING:
    from app.scrapers.animepahe.client import AnimepaheScraper

logger = logging.getLogger(__name__)


async def get_anime_info(scraper: "AnimepaheScraper", anime_uuid: str) -> dict:
    """
    Get anime info including total episode count.

    Args:
        scraper: Animepahe scraper instance
        anime_uuid: Animepahe anime UUID

    Returns:
        Dict with anime info
    """
    try:
        url = f"{settings.ANIMEPAHE_BASE_URL}/anime/{anime_uuid}"
        resp = await scraper.request(url)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Get episode count
        episode_count = 0
        episode_div = soup.select_one(".episode-count")
        if episode_div:
            match = re.search(r"\((\d+)\)", episode_div.text)
            if match:
                episode_count = int(match.group(1))

        # Get title
        title_elem = soup.select_one(".title-wrapper h1 span")
        title = title_elem.text.strip() if title_elem else None

        return {
            "uuid": anime_uuid,
            "title": title,
            "total_episodes": episode_count,
        }
    except Exception as e:
        logger.error("Anime info error for %s: %s", anime_uuid, e)
        return {"uuid": anime_uuid, "total_episodes": 0}


async def get_episodes(scraper: "AnimepaheScraper", anime_uuid: str, page: int = 1) -> dict:
    """
    Get episodes for an anime.

    Args:
        scraper: Animepahe scraper instance
        anime_uuid: Animepahe anime UUID
        page: Page number

    Returns:
        Dict with episodes and pagination info
    """
    try:
        url = f"{settings.ANIMEPAHE_API_URL}?m=release&id={anime_uuid}&sort=episode_asc&page={page}"
        resp = await scraper.request(url)
        resp.raise_for_status()
        data = resp.json()

        return {
            "episodes": [
                {
                    "episode": d.get("episode"),
                    "session": d.get("session"),
                    "title": d.get("title", ""),
                    "snapshot": d.get("snapshot"),
                    "duration": d.get("duration"),
                }
                for d in data.get("data", [])
            ],
            "total": data.get("total", 0),
            "last_page": data.get("last_page", 1),
        }
    except Exception as e:
        logger.error("Episodes error for %s: %s", anime_uuid, e)
        return {"episodes": [], "total": 0, "last_page": 1}


async def find_episode(scraper: "AnimepaheScraper", anime_uuid: str, ep_num: int) -> dict | None:
    """Find episode across all pages."""
    data = await get_episodes(scraper, anime_uuid)

    for ep in data["episodes"]:
        if ep.get("episode") == ep_num:
            return ep

    for page in range(2, data["last_page"] + 1):
        page_data = await get_episodes(scraper, anime_uuid, page)
        for ep in page_data["episodes"]:
            if ep.get("episode") == ep_num:
                return ep

    return None
