"""
Watch API Routes
================

Routes for watching anime - bridging MAL IDs to Animepahe sources.

Endpoints:
    - /api/watch/{mal_id}/{episode} - Get video sources by MAL ID and episode
    - /api/anime/{mal_id}/sources - Get all episodes with sources
    - /api/anime/{mal_id}/animepahe - Get Animepahe match info
    - /api/anime/{mal_id}/episodes - Get episode list from MAL
"""

import logging

from fastapi import APIRouter, HTTPException, Query

from app.core.dependencies import get_scraper
from app.scrapers.jikan import scrape_all_episodes, scrape_anime_details, scrape_episode

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Watch"])


# =============================================================================
# Watch Episode
# =============================================================================


@router.get("/watch/{mal_id}/{episode}")
async def watch(
    mal_id: int,
    episode: int,
    quality: str = Query("1080", description="Preferred quality: 1080, 720, 480, 360"),
):
    """
    Get episode sources by MAL ID and episode number.

    Combines MAL episode info with Animepahe video sources.
    """
    scraper = get_scraper()

    # Fetch anime from MAL
    anime = await scrape_anime_details(mal_id)
    if not anime:
        logger.warning("Anime not found on MAL: %d", mal_id)
        raise HTTPException(404, "Anime not found on MAL")

    title = anime.get("title")
    title_en = anime.get("title_english")

    # Search Animepahe
    results = await scraper.search(title)
    if not results and title_en:
        results = await scraper.search(title_en)
    if not results:
        logger.warning("Anime not found on Animepahe: %s", title)
        raise HTTPException(404, "Anime not found on Animepahe")

    match = scraper._best_match(results, title, title_en)
    uuid = match["uuid"]

    # Find episode across all pages
    target = None
    page = 1
    while not target:
        eps = await scraper.get_episodes(uuid, page)
        if not eps.get("episodes"):
            break
        for ep in eps["episodes"]:
            if ep.get("episode") == episode:
                target = ep
                break
        if page >= eps.get("last_page", 1):
            break
        page += 1

    if not target:
        logger.warning("Episode %d not found for %s", episode, title)
        raise HTTPException(404, f"Episode {episode} not found")

    # Get video sources
    sources = await scraper.get_sources(uuid, target["session"])

    # Get episode info from MAL
    episode_info = await scrape_episode(mal_id, episode)

    return {
        "mal_id": mal_id,
        "title": title,
        "episode": episode,
        "episode_info": episode_info,
        "uuid": uuid,
        "session": target["session"],
        "snapshot": target.get("snapshot"),
        "sources": sources.get("sources", []),
    }


# =============================================================================
# All Episode Sources
# =============================================================================


@router.get("/anime/{mal_id}/sources")
async def all_sources(mal_id: int):
    """
    Get all episodes with sources for an anime.

    Warning: This makes many API calls and may be slow for long series.
    """
    scraper = get_scraper()

    # Fetch anime from MAL
    anime = await scrape_anime_details(mal_id)
    if not anime:
        raise HTTPException(404, "Anime not found on MAL")

    title = anime.get("title")
    title_en = anime.get("title_english")

    # Search Animepahe
    results = await scraper.search(title)
    if not results and title_en:
        results = await scraper.search(title_en)
    if not results:
        raise HTTPException(404, "Anime not found on Animepahe")

    match = scraper._best_match(results, title, title_en)
    uuid = match["uuid"]

    # Fetch all episodes
    episodes = []
    page = 1
    while True:
        eps = await scraper.get_episodes(uuid, page)
        if not eps.get("episodes"):
            break
        episodes.extend(eps["episodes"])
        if page >= eps.get("last_page", 1):
            break
        page += 1

    # Get sources for each episode
    result = []
    for ep in episodes:
        sources = await scraper.get_sources(uuid, ep["session"])
        result.append(
            {
                "episode": ep["episode"],
                "session": ep["session"],
                "snapshot": ep.get("snapshot"),
                "sources": sources.get("sources", []),
            }
        )

    return {
        "mal_id": mal_id,
        "title": title,
        "uuid": uuid,
        "total": len(result),
        "episodes": result,
    }


# =============================================================================
# Animepahe Info
# =============================================================================


@router.get("/anime/{mal_id}/animepahe")
async def animepahe_info(mal_id: int):
    """
    Get Animepahe match for MAL ID.

    Returns the best matching Animepahe entry with episode count.
    """
    scraper = get_scraper()

    anime = await scrape_anime_details(mal_id)
    if not anime:
        raise HTTPException(404, "Anime not found on MAL")

    title = anime.get("title")
    title_en = anime.get("title_english")

    results = await scraper.search(title)
    if not results and title_en:
        results = await scraper.search(title_en)
    if not results:
        raise HTTPException(404, "Anime not found on Animepahe")

    match = scraper._best_match(results, title, title_en)

    # Get accurate episode count (search API returns 0 for airing anime)
    total_episodes = match.get("episodes", 0)
    if total_episodes == 0:
        episodes_data = await scraper.get_episodes(match["uuid"])
        total_episodes = episodes_data.get("total", 0)

    return {
        "mal_id": mal_id,
        "title": title,
        "match": match,
        "total_episodes": total_episodes,
    }


# =============================================================================
# Episode List
# =============================================================================


@router.get("/anime/{mal_id}/episodes")
async def get_episodes(mal_id: int):
    """
    Get all episode titles for an anime from MAL.

    Returns episode numbers, titles, and air dates.
    """
    episodes = await scrape_all_episodes(mal_id)
    return {
        "mal_id": mal_id,
        "total": len(episodes),
        "episodes": episodes,
    }
