"""
Cache Utilities
===============

Simple in-memory TTL cache implementation.
"""

import time
from typing import Any


class Cache:
    """In-memory cache with TTL support."""

    def __init__(self):
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str, ttl: int) -> Any | None:
        """Get value if exists and not expired."""
        if key in self._store:
            cached_time, value = self._store[key]
            if time.time() - cached_time < ttl:
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: Any) -> None:
        """Set value in cache."""
        self._store[key] = (time.time(), value)

    def clear(self) -> None:
        """Clear all cached values."""
        self._store.clear()


# Global cache instance
_cache = Cache()


def get_cache(key: str, ttl: int) -> Any | None:
    """Get cached value."""
    return _cache.get(key, ttl)


def set_cache(key: str, value: Any) -> None:
    """Set cached value."""
    _cache.set(key, value)
