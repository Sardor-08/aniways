"""
Aniways API
===========

FastAPI application with lifespan management.

Run: python server.py
"""

import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings, get_default_cookies
from app.core.dependencies import init_dependencies, cleanup_dependencies
from app.scrapers.animepahe import AnimepaheScraper
from app.routes import animepahe, watch, mal

# Logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources."""
    logger.info("🚀 Starting %s v%s...", settings.API_TITLE, settings.API_VERSION)

    client = httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT)
    scraper = AnimepaheScraper(client)
    scraper.set_cookies(get_default_cookies())
    init_dependencies(client, scraper)

    logger.info("✔️  Application ready")

    yield

    logger.info("👋 Shutting down...")
    await cleanup_dependencies()


def create_app() -> FastAPI:
    """Create FastAPI application."""
    app = FastAPI(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        description=settings.API_DESCRIPTION,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global error handler
    @app.exception_handler(Exception)
    async def error_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(exc) if settings.DEBUG else None},
        )

    # Routes
    app.include_router(mal.router)
    app.include_router(animepahe.router)
    app.include_router(watch.router)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.API_TITLE,
            "version": settings.API_VERSION,
            "docs": "/docs",
            "endpoints": {
                "anime": "/api/anime/{id}",
                "search": "/api/anime?q=...",
                "top": "/api/top/anime",
                "watch": "/api/watch/{mal_id}/{episode}",
            },
        }

    @app.get("/health", tags=["Root"])
    async def health():
        return {"status": "ok", "version": settings.API_VERSION}

    return app


app = create_app()
