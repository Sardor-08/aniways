"""
Matching Utilities
==================

Fuzzy string matching for anime title comparison.
"""

from difflib import SequenceMatcher
from typing import Optional


def fuzzy_score(s1: str, s2: str) -> float:
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()


def best_match(
    results: list[dict],
    title: str,
    title_en: Optional[str] = None,
    title_key: str = "title",
) -> dict:
    """
    Find best matching item from results using fuzzy matching.

    Args:
        results: List of result dicts
        title: Primary title to match
        title_en: English title fallback
        title_key: Key to use for title in results

    Returns:
        Best matching result dict or empty dict
    """
    if not results:
        return {}

    best, best_score = results[0], 0.0

    for item in results:
        item_title = item.get(title_key, "").lower()

        # Exact match
        if item_title == title.lower():
            return item
        if title_en and item_title == title_en.lower():
            return item

        # Fuzzy match
        score = fuzzy_score(item_title, title)
        if title_en:
            score = max(score, fuzzy_score(item_title, title_en))

        if score > best_score:
            best, best_score = item, score

    return best
