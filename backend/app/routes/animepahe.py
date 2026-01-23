"""
Animepahe API Routes
====================

Routes for Animepahe anime streaming service.

Endpoints:
    - /api/animepahe/latest - Latest episode releases
    - /api/animepahe/cookies - DDoS-Guard cookie management
    - /api/animepahe/search - Search anime
    - /api/animepahe/anime/{uuid}/episodes - Episode list
    - /api/animepahe/episode/{uuid}/{session}/sources - Video sources
    - /api/animepahe/extract - Extract video URL from kwik embed
    - /api/animepahe/proxy - CORS proxy for video streams
"""

import logging

import httpx
from fastapi import APIRouter, Body, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_scraper

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/animepahe", tags=["Animepahe"])


# =============================================================================
# Latest Releases
# =============================================================================


@router.get("/latest")
async def get_latest_releases(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=50, description="Results per page"),
):
    """
    Get latest episode releases with MAL IDs.

    Returns recently released episodes with MAL integration for watch URLs.
    """
    return await get_scraper().get_latest_releases(page, limit)


# =============================================================================
# Cookie Management
# =============================================================================


@router.post("/cookies")
async def set_cookies(cookies: dict = Body(..., description="DDoS-Guard cookies")):
    """
    Set Animepahe cookies for DDoS-Guard bypass.

    Cookies should be obtained from browser DevTools after solving the challenge.
    """
    get_scraper().set_cookies(cookies)
    logger.info("Updated Animepahe cookies: %d entries", len(cookies))
    return {"success": True, "count": len(cookies)}


@router.get("/cookies")
async def get_cookies():
    """
    Get current cookies (truncated for security).

    For debugging purposes only.
    """
    cookies = get_scraper().get_cookies()
    return {k: v[:20] + "..." if len(v) > 20 else v for k, v in cookies.items()}


# =============================================================================
# Search & Discovery
# =============================================================================


@router.get("/search")
async def search(q: str = Query(..., min_length=1, description="Search query")):
    """
    Search anime on Animepahe.

    Returns matching anime with UUIDs for episode lookup.
    """
    results = await get_scraper().search(q)
    return {"query": q, "count": len(results), "data": results}


# =============================================================================
# Episodes & Sources
# =============================================================================


@router.get("/anime/{uuid}/episodes")
async def get_episodes(
    uuid: str,
    page: int = Query(1, ge=1, description="Page number"),
):
    """
    Get episodes by Animepahe anime UUID.

    Returns paginated episode list with session IDs.
    """
    return await get_scraper().get_episodes(uuid, page)


@router.get("/episode/{uuid}/{session}/sources")
async def get_sources(uuid: str, session: str):
    """
    Get video sources for an episode.

    Returns available qualities with embed URLs.
    """
    return await get_scraper().get_sources(uuid, session)


# =============================================================================
# Video Extraction & Proxy
# =============================================================================


@router.get("/extract")
async def extract_video(url: str = Query(..., description="Kwik embed URL")):
    """
    Extract m3u8 URL from kwik embed.

    Decodes the obfuscated video URL from kwik.cx embed page.
    """
    video_url = await get_scraper().kwik.extract(url)
    if not video_url:
        logger.warning("Failed to extract video from: %s", url)
        raise HTTPException(404, "Could not extract video URL")
    return {"embed": url, "video": video_url}


@router.get("/proxy")
async def proxy_video(url: str = Query(..., description="Video or m3u8 URL")):
    """
    Proxy m3u8 playlists and video segments.

    Bypasses CORS restrictions and rewrites playlist URLs to go through proxy.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://kwik.cx/",
        "Origin": "https://kwik.cx",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers, follow_redirects=True)
        content = resp.content

        # Rewrite m3u8 playlist URLs to go through proxy
        if ".m3u8" in url:
            text = content.decode("utf-8")
            lines = []
            base_url = url.rsplit("/", 1)[0]

            for line in text.split("\n"):
                line = line.strip()
                if line and not line.startswith("#"):
                    # Convert relative URLs to absolute
                    if not line.startswith("http"):
                        line = f"{base_url}/{line}"
                    # Wrap in proxy URL
                    line = f"/api/animepahe/proxy?url={line}"
                lines.append(line)

            content = "\n".join(lines).encode("utf-8")
            return StreamingResponse(
                iter([content]),
                media_type="application/vnd.apple.mpegurl",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache",
                },
            )

        # Stream .ts segments directly
        content_type = "video/mp2t" if ".ts" in url else "application/octet-stream"
        return StreamingResponse(
            iter([content]),
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache",
            },
        )
