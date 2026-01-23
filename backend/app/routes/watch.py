"""
Watch Routes
============

Bridge MAL IDs to Animepahe video sources.
"""

import logging
from fastapi import APIRouter, HTTPException, Query

from app.core.dependencies import get_scraper
from app.scrapers.jikan import scrape_all_episodes, scrape_anime_details, scrape_episode

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Watch"])


@router.get("/watch/{mal_id}/{episode}")
async def watch(
    mal_id: int,
    episode: int,
    quality: str = Query("1080"),
):
    """Get episode sources by MAL ID and episode number."""
    scraper = get_scraper()

    # Get anime from MAL
    anime = await scrape_anime_details(mal_id)
    if not anime:
        raise HTTPException(404, "Anime not found on MAL")

    title, title_en = anime.get("title"), anime.get("title_english")

    # Search Animepahe
    results = await scraper.search(title) or (await scraper.search(title_en) if title_en else [])
    if not results:
        raise HTTPException(404, "Anime not found on Animepahe")

    match = scraper._best_match(results, title, title_en)
    uuid = match["uuid"]

    # Find episode
    target = None
    page = 1
    while not target:
        eps = await scraper.get_episodes(uuid, page)
        if not eps.get("episodes"):
            break
        target = next((e for e in eps["episodes"] if e.get("episode") == episode), None)
        if target or page >= eps.get("last_page", 1):
            break
        page += 1

    if not target:
        raise HTTPException(404, f"Episode {episode} not found")

    sources = await scraper.get_sources(uuid, target["session"])
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


@router.get("/anime/{mal_id}/sources")
async def all_sources(mal_id: int):
    """Get all episodes with sources (slow for long series)."""
    scraper = get_scraper()

    anime = await scrape_anime_details(mal_id)
    if not anime:
        raise HTTPException(404, "Anime not found on MAL")

    title, title_en = anime.get("title"), anime.get("title_english")

    results = await scraper.search(title) or (await scraper.search(title_en) if title_en else [])
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

    # Get sources for each
    result = []
    for ep in episodes:
        sources = await scraper.get_sources(uuid, ep["session"])
        result.append({
            "episode": ep["episode"],
            "session": ep["session"],
            "snapshot": ep.get("snapshot"),
            "sources": sources.get("sources", []),
        })

    return {"mal_id": mal_id, "title": title, "uuid": uuid, "total": len(result), "episodes": result}


@router.get("/anime/{mal_id}/animepahe")
async def animepahe_info(mal_id: int):
    """Get Animepahe match for MAL ID."""
    scraper = get_scraper()

    anime = await scrape_anime_details(mal_id)
    if not anime:
        raise HTTPException(404, "Anime not found on MAL")

    title, title_en = anime.get("title"), anime.get("title_english")

    results = await scraper.search(title) or (await scraper.search(title_en) if title_en else [])
    if not results:
        raise HTTPException(404, "Anime not found on Animepahe")

    match = scraper._best_match(results, title, title_en)

    # Get accurate episode count
    total = match.get("episodes", 0)
    if not total:
        eps = await scraper.get_episodes(match["uuid"])
        total = eps.get("total", 0)

    return {"mal_id": mal_id, "title": title, "match": match, "total_episodes": total}


@router.get("/anime/{mal_id}/episodes")
async def get_episodes(mal_id: int):
    """Get all episode titles from MAL."""
    episodes = await scrape_all_episodes(mal_id)
    return {"mal_id": mal_id, "total": len(episodes), "episodes": episodes}
