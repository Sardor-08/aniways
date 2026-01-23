"""
String Matching Utilities
=========================

Fuzzy matching for anime title comparison.
"""

from difflib import SequenceMatcher


def similarity(a: str, b: str) -> float:
    """Calculate similarity ratio (0-1) between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def best_match(
    items: list[dict],
    title: str,
    title_en: str | None = None,
    key: str = "title",
) -> dict:
    """
    Find best matching item using fuzzy matching.
    
    Returns first exact match, or highest similarity score.
    """
    if not items:
        return {}

    title_lower = title.lower()
    title_en_lower = title_en.lower() if title_en else None

    best, best_score = items[0], 0.0

    for item in items:
        item_title = item.get(key, "").lower()

        # Exact match = immediate return
        if item_title == title_lower or item_title == title_en_lower:
            return item

        # Calculate similarity
        score = similarity(item_title, title)
        if title_en:
            score = max(score, similarity(item_title, title_en))

        if score > best_score:
            best, best_score = item, score

    return best
