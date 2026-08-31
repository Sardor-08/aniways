"""
Application Configuration
=========================

Centralized settings with environment variable support.
"""

import os
from dataclasses import dataclass, field
from functools import lru_cache

# Environment helpers
_env = os.getenv
_env_bool = lambda k, d=False: _env(k, str(d)).lower() in ("true", "1", "yes")
_env_int = lambda k, d=0: int(_env(k, str(d)) or d)


@dataclass(frozen=True, slots=True)
class Settings:
    """Immutable application settings."""

    # Server
    DEBUG: bool = field(default_factory=lambda: _env_bool("DEBUG"))
    HOST: str = field(default_factory=lambda: _env("HOST", "127.0.0.1"))
    PORT: int = field(default_factory=lambda: _env_int("PORT", 4444))

    # API Info
    API_TITLE: str = "Anilo.uz API"
    API_VERSION: str = "2.0.0"
    API_DESCRIPTION: str = "Anilo.uz anime streaming API - Jikan (MAL) + Animepahe"

    # External URLs
    JIKAN_BASE_URL: str = "https://api.jikan.moe/v4"
    ANIMEPAHE_BASE_URL: str = "https://animepahe.pw"

    # Rate Limiting & Retries
    JIKAN_RATE_LIMIT_DELAY: float = 0.4
    JIKAN_MAX_RETRIES: int = 3

    # Cache TTL (seconds)
    CACHE_TTL_SHORT: int = 300   # 5 min: top, seasonal, search
    CACHE_TTL_LONG: int = 3600   # 1 hour: anime details, episodes

    # HTTP
    HTTP_TIMEOUT: float = 30.0
    USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    )

    @property
    def animepahe_api(self) -> str:
        return f"{self.ANIMEPAHE_BASE_URL}/api"

    @property
    def animepahe_headers(self) -> dict[str, str]:
        return {
            "User-Agent": self.USER_AGENT,
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.9",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{self.ANIMEPAHE_BASE_URL}/",
        }

    @property
    def kwik_headers(self) -> dict[str, str]:
        return {
            "User-Agent": self.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": f"{self.ANIMEPAHE_BASE_URL}/",
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()


# =============================================================================
# DDoS-Guard Cookies
# =============================================================================
#
# ⚠️  Configure these for Animepahe to work!
#
# Get fresh cookies:
#   1. Use a VPN (recommended)
#   2. Visit https://animepahe.si in browser
#   3. DevTools (F12) → Application → Cookies
#   4. Copy __ddg* values below or set env vars
#
# Env vars: ANIMEPAHE_DDG1, ANIMEPAHE_DDG2, etc.
# =============================================================================

def get_default_cookies() -> dict[str, str]:
    """Get DDoS-Guard bypass cookies."""
    return {
        "__ddg1_": _env("ANIMEPAHE_DDG1", "5H0114JE1p0wQHdJiV2O"),
        "__ddg2_": _env("ANIMEPAHE_DDG2", "FxnuwLkvPnXSQtPE"),
        "__ddg8_": _env("ANIMEPAHE_DDG8", "j55RhixQcxVPfvqt"),
        "__ddg9_": _env("ANIMEPAHE_DDG9", "51.158.195.12"),
        "__ddg10_": _env("ANIMEPAHE_DDG10", "1769167572"),
        "__ddgid_": _env("ANIMEPAHE_DDGID", "ExAWs3AJTzpAKb8m"),
        "__ddgmark_": _env("ANIMEPAHE_DDGMARK", "slbgrX6Jj2jTxuo2"),
    }
