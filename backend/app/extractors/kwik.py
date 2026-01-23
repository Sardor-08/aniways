"""
Kwik Video Extractor
====================

Extracts video stream URLs from kwik.cx embed pages.
"""

import logging
import re
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

STREAM_KEYWORDS = ["m3u8", "uwu", "stream", "owocdn", "vault", "source", "files"]


class KwikExtractor:
    """Extracts m3u8 video URLs from kwik.cx embed pages."""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client

    async def extract(self, embed_url: str) -> Optional[str]:
        """
        Extract video stream URL from kwik embed page.

        Args:
            embed_url: Kwik embed URL (e.g., https://kwik.cx/e/xxx)

        Returns:
            Video stream URL or None
        """
        try:
            download_url = embed_url.replace("/e/", "/f/")
            resp = await self.client.get(
                download_url, headers=settings.KWIK_HEADERS, follow_redirects=True
            )
            resp.raise_for_status()
            html = resp.text

            # Try extraction methods
            url = self._find_download_url(html)
            if url:
                return url

            url = self._find_direct_url(html)
            if url:
                return url

            return self._parse_stream_url(html)

        except Exception as e:
            logger.error("Kwik extraction error: %s", e)
            return None

    def _find_download_url(self, html: str) -> Optional[str]:
        """Find download URL from form action."""
        patterns = [
            r'action="(https://[^"]+)"',
            r"action='(https://[^']+)'",
            r'https://[a-z0-9]+\.kwik\.[a-z]+/[^\s\'"<>]+\.mp4',
            r'https://[^\s\'"<>]+/v/[^\s\'"<>]+',
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                url = match.group(1) if match.lastindex else match.group(0)
                if "kwik" in url or ".mp4" in url:
                    return url
        return None

    def _find_direct_url(self, html: str) -> Optional[str]:
        """Find direct stream URLs in HTML."""
        patterns = [
            r'https?://[a-z]+\.owocdn\.top/[^\s\'"]+\.m3u8',
            r'https?://[^\s\'"]+/uwu\.m3u8',
            r'source\s*:\s*[\'"]([^\'"]+\.m3u8)[\'"]',
            r'file\s*:\s*[\'"]([^\'"]+\.m3u8)[\'"]',
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return match.group(1) if match.lastindex else match.group(0)
        return None

    def _parse_stream_url(self, html: str) -> Optional[str]:
        """Parse stream URL from packed JavaScript."""
        for match in re.findall(r"'([^']{50,})'\.split\('\|'\)", html):
            keywords = match.split("|")
            if not any(k in keywords for k in STREAM_KEYWORDS):
                continue

            # Find hash
            hash_val = next(
                (k for k in keywords if len(k) == 64 and k.isalnum() and not k.isalpha()),
                None,
            )
            if not hash_val:
                hash_val = next(
                    (k for k in keywords if len(k) == 32 and k.isalnum() and not k.isalpha()),
                    None,
                )
            if not hash_val:
                continue

            # Determine CDN
            if "eu" in keywords:
                domain = "eu.owocdn.top"
            elif "na" in keywords:
                domain = "na.owocdn.top"
            else:
                domain = "vault.owocdn.top"

            stream_id = next((k for k in keywords if k.isdigit() and len(k) == 2), "01")
            return f"https://{domain}/stream/{stream_id}/{hash_val}/uwu.m3u8"

        return None
