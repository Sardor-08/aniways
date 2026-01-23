"""
Animepahe HTTP Client
=====================

Base client for Animepahe with cookie management.
"""

import logging

import httpx

from app.core.config import settings
from app.extractors.kwik import KwikExtractor

logger = logging.getLogger(__name__)


class AnimepaheScraper:
    """Main Animepahe scraper combining all functionality."""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.cookies: dict[str, str] = {}
        self.kwik = KwikExtractor(client)

        # Import sub-modules
        from app.scrapers.animepahe import search, episodes, sources, latest

        self._search = search
        self._episodes = episodes
        self._sources = sources
        self._latest = latest

    # =========================================================================
    # Cookie Management
    # =========================================================================

    def set_cookies(self, cookies: dict[str, str]) -> None:
        """Set DDoS-Guard bypass cookies."""
        self.cookies = cookies
        logger.debug("Updated cookies: %d entries", len(cookies))

    def get_cookies(self) -> dict[str, str]:
        """Get current cookies."""
        return self.cookies

    # =========================================================================
    # HTTP Requests
    # =========================================================================

    async def request(self, url: str, **kwargs) -> httpx.Response:
        """Make authenticated request to Animepahe."""
        headers = {**settings.ANIMEPAHE_HEADERS, **kwargs.pop("headers", {})}
        cookies = {**self.cookies, **kwargs.pop("cookies", {})}
        return await self.client.get(url, headers=headers, cookies=cookies, **kwargs)

    # =========================================================================
    # Search
    # =========================================================================

    async def search(self, query: str) -> list[dict]:
        """Search anime on Animepahe."""
        return await self._search.search(self, query)

    def _best_match(self, results: list[dict], title: str, title_en: str = None) -> dict:
        """Find best matching anime from results."""
        return self._search.best_match(results, title, title_en)

    # =========================================================================
    # Episodes
    # =========================================================================

    async def get_anime_info(self, anime_uuid: str) -> dict:
        """Get anime info including episode count."""
        return await self._episodes.get_anime_info(self, anime_uuid)

    async def get_episodes(self, anime_uuid: str, page: int = 1) -> dict:
        """Get episodes for an anime."""
        return await self._episodes.get_episodes(self, anime_uuid, page)

    # =========================================================================
    # Video Sources
    # =========================================================================

    async def get_sources(self, anime_uuid: str, episode_session: str) -> dict:
        """Get video sources for an episode."""
        return await self._sources.get_sources(self, anime_uuid, episode_session)

    async def get_video_url(self, mal_id: int, episode: int, quality: str = "1080") -> dict:
        """Complete flow: MAL ID -> video URL."""
        return await self._sources.get_video_url(self, mal_id, episode, quality)

    # =========================================================================
    # Latest Releases
    # =========================================================================

    async def get_latest_releases(self, page: int = 1, limit: int = 12) -> dict:
        """Get latest episode releases with MAL IDs."""
        return await self._latest.get_latest_releases(self, page, limit)
