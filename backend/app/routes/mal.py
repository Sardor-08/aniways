"""
MyAnimeList API Routes
======================

Routes for fetching anime data from MyAnimeList via Jikan API.

Endpoints:
    - /api/top/anime - Top anime by various filters
    - /api/browse/anime - Browse with sorting/filtering
    - /api/anime/{id} - Anime details, recommendations, characters
    - /api/anime - Search
    - /api/seasons/* - Seasonal anime
    - /api/schedules - Weekly broadcast schedule
"""

import logging
from fastapi import APIRouter, HTTPException, Query

from app.scrapers.jikan import (
    browse_anime,
    scrape_anime_details,
    scrape_characters,
    scrape_recommendations,
    scrape_schedule,
    scrape_seasonal_anime,
    scrape_top_anime,
    search_anime,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["MAL"])


# =============================================================================
# Top Anime
# =============================================================================


@router.get("/top/anime")
async def get_top_anime(
    filter: str = Query("airing", description="Filter: airing, upcoming, bypopularity, favorite"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=50, description="Results per page (max 50)"),
    type: str = Query(None, description="Type: tv, movie, ova, special, ona, music"),
):
    """
    Get top anime from MyAnimeList.

    Returns anime ranked by the specified filter criterion.
    """
    return await scrape_top_anime(filter, min(limit, 50), type, page)


@router.get("/mal/top")
async def get_top_anime_legacy(filter: str = "airing", limit: int = 10):
    """Legacy alias for /top/anime."""
    return await get_top_anime(filter=filter, limit=limit)


# =============================================================================
# Browse Anime
# =============================================================================


@router.get("/browse/anime")
async def get_browse_anime(
    status: str = Query(None, description="Status: airing, complete, upcoming"),
    order_by: str = Query(None, description="Order by: score, popularity, start_date, rank, members"),
    sort: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=25),
):
    """
    Browse anime with filters and sorting.

    Allows filtering by status and sorting by various criteria.
    """
    return await browse_anime(status, order_by, sort, page, limit)


# =============================================================================
# Anime Details
# =============================================================================


@router.get("/anime/{mal_id}")
async def get_anime(mal_id: int):
    """
    Get anime details by MAL ID.

    Returns comprehensive anime information including synopsis, stats, and metadata.
    """
    data = await scrape_anime_details(mal_id)
    if not data:
        logger.warning("Anime not found: %d", mal_id)
        raise HTTPException(status_code=404, detail=f"Anime with ID {mal_id} not found")
    return {"data": data}


@router.get("/anime/{mal_id}/full")
async def get_anime_full(mal_id: int):
    """Get full anime details (alias for /anime/{mal_id})."""
    return await get_anime(mal_id)


@router.get("/anime/{mal_id}/recommendations")
async def get_anime_recommendations(
    mal_id: int,
    limit: int = Query(12, ge=1, le=50, description="Max recommendations to return"),
):
    """
    Get anime recommendations based on user votes.

    Returns similar anime that users who liked this anime also enjoyed.
    """
    data = await scrape_recommendations(mal_id, limit)
    return {"data": data}


@router.get("/anime/{mal_id}/characters")
async def get_anime_characters(
    mal_id: int,
    limit: int = Query(12, ge=1, le=50, description="Max characters to return"),
):
    """
    Get anime characters with voice actors.

    Returns main and supporting characters with their Japanese voice actors.
    """
    data = await scrape_characters(mal_id, limit)
    return {"data": data}


@router.get("/mal/anime/{mal_id}")
async def get_anime_legacy(mal_id: int):
    """Legacy alias for /anime/{mal_id}."""
    return await get_anime(mal_id)


# =============================================================================
# Search
# =============================================================================


@router.get("/anime")
async def search_anime_route(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=25),
):
    """
    Search anime on MyAnimeList.

    Returns anime matching the search query with pagination.
    """
    data, total_pages = await search_anime(q, page, limit)
    return {
        "data": data,
        "pagination": {
            "last_visible_page": total_pages,
            "has_next_page": page < total_pages,
        },
    }


# =============================================================================
# Seasonal Anime
# =============================================================================


@router.get("/seasons/now")
async def get_current_season(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=50),
):
    """
    Get current season anime.

    Returns anime airing in the current season.
    """
    data = await scrape_seasonal_anime(limit=limit)
    return {
        "data": data,
        "pagination": {"last_visible_page": 1, "has_next_page": False},
    }


@router.get("/seasons/upcoming")
async def get_upcoming_season(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=50),
):
    """
    Get upcoming anime.

    Returns anime scheduled to air in future seasons.
    """
    return await scrape_top_anime("upcoming", limit, None, page)


@router.get("/seasons/{year}/{season}")
async def get_season(
    year: int,
    season: str,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=50),
):
    """
    Get anime by specific season.

    Args:
        year: Year (e.g., 2024)
        season: winter, spring, summer, fall
    """
    valid_seasons = ["winter", "spring", "summer", "fall"]
    if season.lower() not in valid_seasons:
        raise HTTPException(
            status_code=400,
            detail=f"Season must be one of: {', '.join(valid_seasons)}",
        )

    data = await scrape_seasonal_anime(year, season, limit)
    return {
        "data": data,
        "pagination": {"last_visible_page": 1, "has_next_page": False},
    }


# =============================================================================
# Schedule
# =============================================================================


@router.get("/schedules")
async def get_schedule(
    filter: str = Query(None, description="Day: monday, tuesday, etc., or unknown/other"),
    page: int = Query(1, ge=1),
):
    """
    Get weekly anime broadcast schedule.

    Returns anime airing on each day of the week with broadcast times.
    """
    valid_filters = [
        "monday", "tuesday", "wednesday", "thursday",
        "friday", "saturday", "sunday", "unknown", "other",
    ]
    filter_lower = filter.lower() if filter else None

    if filter_lower and filter_lower not in valid_filters:
        raise HTTPException(
            status_code=400,
            detail=f"Filter must be one of: {', '.join(valid_filters)}",
        )

    data = await scrape_schedule(filter_lower, page)
    return {
        "data": data,
        "pagination": {"last_visible_page": 1, "has_next_page": len(data) >= 25},
    }
