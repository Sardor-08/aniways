"""
Animepahe Scraper Client
========================

Main class with HTTP client and cookie management.
Delegates to submodules for specific functionality.
"""

import logging
import httpx

from app.core.config import settings
from app.extractors.kwik import KwikExtractor

logger = logging.getLogger(__name__)


class AnimepaheScraper:
    """Animepahe scraper - delegates to submodules."""

    __slots__ = ("client", "cookies", "kwik")

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.cookies: dict[str, str] = {}
        self.kwik = KwikExtractor(client)

    # =========================================================================
    # Cookie Management
    # =========================================================================

    def set_cookies(self, cookies: dict[str, str]) -> None:
        """Set DDoS-Guard bypass cookies."""
        self.cookies = cookies

    def get_cookies(self) -> dict[str, str]:
        """Get current cookies."""
        return self.cookies

    # =========================================================================
    # HTTP Request
    # =========================================================================

    async def _request(self, url: str, **kwargs) -> httpx.Response:
        """Make authenticated request."""
        return await self.client.get(
            url,
            headers={**settings.animepahe_headers, **kwargs.pop("headers", {})},
            cookies={**self.cookies, **kwargs.pop("cookies", {})},
            **kwargs,
        )

    # =========================================================================
    # Search (delegates to search.py)
    # =========================================================================

    async def search(self, query: str) -> list[dict]:
        """Search anime on Animepahe."""
        from app.scrapers.animepahe.search import search
        return await search(self, query)

    def _best_match(self, results: list[dict], title: str, title_en: str = None) -> dict:
        """Find best matching anime from results."""
        from app.scrapers.animepahe.search import find_best_match
        return find_best_match(results, title, title_en)

    # =========================================================================
    # Episodes (delegates to episodes.py)
    # =========================================================================

    async def get_anime_info(self, uuid: str) -> dict:
        """Get anime info including episode count."""
        from app.scrapers.animepahe.episodes import get_anime_info
        return await get_anime_info(self, uuid)

    async def get_episodes(self, uuid: str, page: int = 1) -> dict:
        """Get episodes for an anime."""
        from app.scrapers.animepahe.episodes import get_episodes
        return await get_episodes(self, uuid, page)

    # =========================================================================
    # Video Sources (delegates to sources.py)
    # =========================================================================

    async def get_sources(self, uuid: str, session: str) -> dict:
        """Get video sources for an episode."""
        from app.scrapers.animepahe.sources import get_sources
        return await get_sources(self, uuid, session)

    async def get_video_url(self, mal_id: int, episode: int, quality: str = "1080") -> dict:
        """Complete flow: MAL ID -> video URL."""
        from app.scrapers.animepahe.sources import get_video_url
        return await get_video_url(self, mal_id, episode, quality)

    # =========================================================================
    # Latest Releases (delegates to latest.py)
    # =========================================================================

    async def get_latest_releases(self, page: int = 1, limit: int = 12) -> dict:
        """Get latest episode releases with MAL IDs."""
        from app.scrapers.animepahe.latest import get_latest_releases
        return await get_latest_releases(self, page, limit)
