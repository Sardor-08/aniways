"""
Application Dependencies
========================

Dependency injection for shared resources.

Usage:
    from app.core.dependencies import get_client, get_scraper
"""

from typing import TYPE_CHECKING

import httpx

if TYPE_CHECKING:
    from app.scrapers.animepahe import AnimepaheScraper

_client: httpx.AsyncClient | None = None
_scraper: "AnimepaheScraper | None" = None


def get_client() -> httpx.AsyncClient:
    """Get the shared HTTP client instance."""
    if _client is None:
        raise RuntimeError("HTTP client not initialized")
    return _client


def get_scraper() -> "AnimepaheScraper":
    """Get the Animepahe scraper instance."""
    if _scraper is None:
        raise RuntimeError("Scraper not initialized")
    return _scraper


def init_dependencies(client: httpx.AsyncClient, scraper: "AnimepaheScraper") -> None:
    """Initialize global dependencies."""
    global _client, _scraper
    _client = client
    _scraper = scraper


async def cleanup_dependencies() -> None:
    """Cleanup dependencies on shutdown."""
    global _client, _scraper
    if _client:
        await _client.aclose()
    _client = None
    _scraper = None
