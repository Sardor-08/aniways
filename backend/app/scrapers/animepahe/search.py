"""
Animepahe Search
================

Search functionality for Animepahe.
"""

import logging
from typing import TYPE_CHECKING, Optional

from app.core.config import settings
from app.utils.matching import best_match as _best_match

if TYPE_CHECKING:
    from app.scrapers.animepahe.client import AnimepaheScraper

logger = logging.getLogger(__name__)


async def search(scraper: "AnimepaheScraper", query: str) -> list[dict]:
    """
    Search anime on Animepahe.

    Args:
        scraper: Animepahe scraper instance
        query: Search query string

    Returns:
        List of matching anime
    """
    try:
        resp = await scraper.request(f"{settings.ANIMEPAHE_API_URL}?m=search&q={query}")
        resp.raise_for_status()
        return [
            {
                "title": d.get("title"),
                "uuid": d.get("session"),
                "type": d.get("type"),
                "episodes": d.get("episodes"),
                "status": d.get("status"),
                "season": d.get("season"),
                "year": d.get("year"),
                "score": d.get("score"),
                "poster": d.get("poster"),
            }
            for d in resp.json().get("data", [])
        ]
    except Exception as e:
        logger.error("Search error: %s", e)
        return []


def best_match(
    results: list[dict], title: str, title_en: Optional[str] = None
) -> dict:
    """Find best matching anime from search results."""
    return _best_match(results, title, title_en, title_key="title")
