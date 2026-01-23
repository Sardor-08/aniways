"""
Application Configuration
=========================

Centralized configuration management with sensible defaults.

Usage:
    from app.core.config import settings
"""

import os
from dataclasses import dataclass, field


def get_env(key: str, default: str = "") -> str:
    """Get environment variable with default fallback."""
    return os.getenv(key, default)


def get_env_bool(key: str, default: bool = False) -> bool:
    """Get boolean environment variable."""
    return get_env(key, str(default)).lower() in ("true", "1", "yes")


def get_env_int(key: str, default: int = 0) -> int:
    """Get integer environment variable."""
    try:
        return int(get_env(key, str(default)))
    except ValueError:
        return default


@dataclass
class Settings:
    """Application settings."""

    # Server
    DEBUG: bool = field(default_factory=lambda: get_env_bool("DEBUG", False))
    HOST: str = field(default_factory=lambda: get_env("HOST", "127.0.0.1"))
    PORT: int = field(default_factory=lambda: get_env_int("PORT", 4444))

    # API Info
    API_TITLE: str = "Aniways API"
    API_VERSION: str = "2.0.0"
    API_DESCRIPTION: str = "Anime streaming API - Jikan (MAL) + Animepahe"

    # External URLs
    JIKAN_BASE_URL: str = "https://api.jikan.moe/v4" # Use latest version
    ANIMEPAHE_BASE_URL: str = "https://animepahe.si" # Update if domain changes

    # Rate Limiting
    JIKAN_RATE_LIMIT_DELAY: float = 0.4
    JIKAN_MAX_RETRIES: int = 3

    # Cache TTL (seconds)
    CACHE_TTL_TOP: int = 300
    CACHE_TTL_SEASONAL: int = 300
    CACHE_TTL_ANIME: int = 3600
    CACHE_TTL_EPISODES: int = 3600
    CACHE_TTL_SEARCH: int = 300

    # HTTP Client
    HTTP_TIMEOUT: float = 30.0
    USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    )

    @property
    def ANIMEPAHE_API_URL(self) -> str:
        return f"{self.ANIMEPAHE_BASE_URL}/api"

    @property
    def ANIMEPAHE_HEADERS(self) -> dict[str, str]:
        return {
            "User-Agent": self.USER_AGENT,
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.9",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{self.ANIMEPAHE_BASE_URL}/",
        }

    @property
    def KWIK_HEADERS(self) -> dict[str, str]:
        return {
            "User-Agent": self.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": f"{self.ANIMEPAHE_BASE_URL}/",
        }


settings = Settings()

# =============================================================================
# Animepahe DDoS-Guard Bypass Cookies
# =============================================================================
#
# ⚠️  IMPORTANT: Configure these cookies for Animepahe to work!
#
# These cookies bypass DDoS-Guard protection. Default values may expire.
# To get fresh cookies:
#   1. Use a VPN (RECOMMENDED - improves reliability)
#   2. Visit https://animepahe.si in your browser
#   3. Open DevTools (F12) → Application → Cookies
#   4. Copy the __ddg* cookie values below or set as environment variables
#
# Environment variables (optional):
#   ANIMEPAHE_DDG1, ANIMEPAHE_DDG2, ANIMEPAHE_DDG8, ANIMEPAHE_DDG9,
#   ANIMEPAHE_DDG10, ANIMEPAHE_DDGID, ANIMEPAHE_DDGMARK
#
# 💡 TIP: Using a VPN with a consistent IP address helps cookies last longer.
# =============================================================================

def get_default_cookies() -> dict[str, str]:
    """Get default Animepahe DDoS-Guard bypass cookies."""
    return {
        "__ddg1_": get_env("ANIMEPAHE_DDG1", "5H0114JE1p0wQHdJiV2O"),
        "__ddg2_": get_env("ANIMEPAHE_DDG2", "FxnuwLkvPnXSQtPE"),
        "__ddg8_": get_env("ANIMEPAHE_DDG8", "j55RhixQcxVPfvqt"),
        "__ddg9_": get_env("ANIMEPAHE_DDG9", "51.158.195.12"),
        "__ddg10_": get_env("ANIMEPAHE_DDG10", "1769167572"),
        "__ddgid_": get_env("ANIMEPAHE_DDGID", "ExAWs3AJTzpAKb8m"),
        "__ddgmark_": get_env("ANIMEPAHE_DDGMARK", "slbgrX6Jj2jTxuo2"),
    }


ANIMEPAHE_COOKIES = get_default_cookies()
