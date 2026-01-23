"""
Kwik Video Extractor
====================

Extracts m3u8 stream URLs from kwik.cx embed pages.
"""

import logging
import re
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Keywords indicating stream data in packed JS
_STREAM_KEYWORDS = frozenset(["m3u8", "uwu", "stream", "owocdn", "vault", "source", "files"])

# Precompiled regex patterns
_DOWNLOAD_PATTERNS = [
    re.compile(r'action="(https://[^"]+)"', re.I),
    re.compile(r"action='(https://[^']+)'", re.I),
    re.compile(r'https://[a-z0-9]+\.kwik\.[a-z]+/[^\s\'"<>]+\.mp4', re.I),
]
_STREAM_PATTERNS = [
    re.compile(r'https?://[a-z]+\.owocdn\.top/[^\s\'"]+\.m3u8', re.I),
    re.compile(r'https?://[^\s\'"]+/uwu\.m3u8', re.I),
    re.compile(r'(?:source|file)\s*:\s*[\'"]([^\'"]+\.m3u8)[\'"]', re.I),
]
_PACKED_JS = re.compile(r"'([^']{50,})'\.split\('\|'\)")


class KwikExtractor:
    """Extracts video URLs from kwik.cx."""

    __slots__ = ("client",)

    def __init__(self, client: httpx.AsyncClient):
        self.client = client

    async def extract(self, embed_url: str) -> Optional[str]:
        """Extract video URL from kwik embed page."""
        try:
            url = embed_url.replace("/e/", "/f/")
            resp = await self.client.get(url, headers=settings.kwik_headers, follow_redirects=True)
            resp.raise_for_status()
            html = resp.text

            return self._find_download(html) or self._find_stream(html) or self._parse_packed(html)
        except Exception as e:
            logger.error("Kwik extraction failed: %s", e)
            return None

    def _find_download(self, html: str) -> Optional[str]:
        """Find download URL from form/direct links."""
        for pattern in _DOWNLOAD_PATTERNS:
            if m := pattern.search(html):
                url = m.group(1) if m.lastindex else m.group(0)
                if "kwik" in url or ".mp4" in url:
                    return url
        return None

    def _find_stream(self, html: str) -> Optional[str]:
        """Find direct m3u8 stream URL."""
        for pattern in _STREAM_PATTERNS:
            if m := pattern.search(html):
                return m.group(1) if m.lastindex else m.group(0)
        return None

    def _parse_packed(self, html: str) -> Optional[str]:
        """Parse stream URL from packed JavaScript."""
        for match in _PACKED_JS.findall(html):
            keywords = match.split("|")
            if not _STREAM_KEYWORDS & set(keywords):
                continue

            # Find hash (64 or 32 char alphanumeric)
            hash_val = next(
                (k for k in keywords if len(k) in (32, 64) and k.isalnum() and not k.isalpha()),
                None,
            )
            if not hash_val:
                continue

            # Determine CDN region
            domain = (
                "eu.owocdn.top" if "eu" in keywords else
                "na.owocdn.top" if "na" in keywords else
                "vault.owocdn.top"
            )
            stream_id = next((k for k in keywords if k.isdigit() and len(k) == 2), "01")

            return f"https://{domain}/stream/{stream_id}/{hash_val}/uwu.m3u8"

        return None
