"""
Cache Utilities
===============

Lightweight in-memory TTL cache.
"""

import time
from typing import Any

_store: dict[str, tuple[float, Any]] = {}


def get(key: str, ttl: int) -> Any | None:
    """Get value if exists and not expired."""
    if key in _store:
        ts, val = _store[key]
        if time.time() - ts < ttl:
            return val
        del _store[key]
    return None


def set(key: str, value: Any) -> None:
    """Store value with current timestamp."""
    _store[key] = (time.time(), value)


def clear() -> None:
    """Clear all cached data."""
    _store.clear()
