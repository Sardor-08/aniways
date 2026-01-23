"""
Animepahe Routes
================

Animepahe scraping endpoints.
"""

import logging
import httpx
from fastapi import APIRouter, Body, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_scraper

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/animepahe", tags=["Animepahe"])


@router.get("/latest")
async def get_latest(page: int = Query(1, ge=1), limit: int = Query(12, ge=1, le=50)):
    """Get latest episode releases with MAL IDs."""
    return await get_scraper().get_latest_releases(page, limit)


@router.post("/cookies")
async def set_cookies(cookies: dict = Body(...)):
    """Set DDoS-Guard bypass cookies."""
    get_scraper().set_cookies(cookies)
    return {"success": True, "count": len(cookies)}


@router.get("/cookies")
async def get_cookies():
    """Get current cookies (truncated)."""
    return {k: f"{v[:20]}..." if len(v) > 20 else v for k, v in get_scraper().get_cookies().items()}


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    """Search anime on Animepahe."""
    results = await get_scraper().search(q)
    return {"query": q, "count": len(results), "data": results}


@router.get("/anime/{uuid}/episodes")
async def get_episodes(uuid: str, page: int = Query(1, ge=1)):
    """Get episodes by anime UUID."""
    return await get_scraper().get_episodes(uuid, page)


@router.get("/episode/{uuid}/{session}/sources")
async def get_sources(uuid: str, session: str):
    """Get video sources for an episode."""
    return await get_scraper().get_sources(uuid, session)


@router.get("/extract")
async def extract_video(url: str = Query(...)):
    """Extract m3u8 URL from kwik embed."""
    if video_url := await get_scraper().kwik.extract(url):
        return {"embed": url, "video": video_url}
    raise HTTPException(404, "Could not extract video URL")


@router.get("/proxy")
async def proxy_video(url: str = Query(...)):
    """Proxy m3u8 playlists and video segments (CORS bypass)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://kwik.cx/",
        "Origin": "https://kwik.cx",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers, follow_redirects=True)
        content = resp.content

        # Rewrite m3u8 URLs to go through proxy
        if ".m3u8" in url:
            text = content.decode("utf-8")
            base = url.rsplit("/", 1)[0]
            lines = []

            for line in text.split("\n"):
                line = line.strip()
                if line and not line.startswith("#"):
                    if not line.startswith("http"):
                        line = f"{base}/{line}"
                    line = f"/api/animepahe/proxy?url={line}"
                lines.append(line)

            content = "\n".join(lines).encode()
            return StreamingResponse(
                iter([content]),
                media_type="application/vnd.apple.mpegurl",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        return StreamingResponse(
            iter([content]),
            media_type="video/mp2t" if ".ts" in url else "application/octet-stream",
            headers={"Access-Control-Allow-Origin": "*"},
        )
