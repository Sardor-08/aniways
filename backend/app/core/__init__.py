"""Core application modules."""

from app.core.config import settings
from app.core.dependencies import get_client, get_scraper

__all__ = ["settings", "get_client", "get_scraper"]
