"""
Aniways API - FastAPI Application
=================================

Main application module with lifespan management and middleware configuration.

Run with:
    python server.py
    uvicorn server:app --reload --port 4444
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

# =============================================================================
# Logging Configuration
# =============================================================================

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# =============================================================================
# Application Lifespan
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Initializes shared resources on startup and cleans up on shutdown.
    """
    logger.info("🚀 Starting %s v%s...", settings.API_TITLE, settings.API_VERSION)

    # Initialize HTTP client
    client = httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT)

    # Initialize Animepahe scraper
    scraper = AnimepaheScraper(client)
    scraper.set_cookies(get_default_cookies())

    # Register dependencies
    init_dependencies(client, scraper)

    logger.info("✔️  Application ready")

    yield

    # Cleanup
    logger.info("👋 Shutting down...")
    await cleanup_dependencies()
    logger.info("✔️  Cleanup complete")


# =============================================================================
# Application Factory
# =============================================================================


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        description=settings.API_DESCRIPTION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # -------------------------------------------------------------------------
    # CORS Middleware
    # -------------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -------------------------------------------------------------------------
    # Exception Handlers
    # -------------------------------------------------------------------------
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Global exception handler for unhandled errors."""
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(exc) if settings.DEBUG else "An error occurred",
            },
        )

    # -------------------------------------------------------------------------
    # Routes
    # -------------------------------------------------------------------------
    app.include_router(mal.router)
    app.include_router(animepahe.router)
    app.include_router(watch.router)

    # -------------------------------------------------------------------------
    # Root Endpoint
    # -------------------------------------------------------------------------
    @app.get("/", tags=["Root"])
    async def root():
        """API root endpoint with service information."""
        return {
            "name": settings.API_TITLE,
            "version": settings.API_VERSION,
            "docs": "/docs",
            "health": "/health",
            "endpoints": {
                "anime": "/api/anime/{id}",
                "search": "/api/anime?q=...",
                "top": "/api/top/anime",
                "seasonal": "/api/seasons/now",
                "watch": "/api/watch/{mal_id}/{episode}",
                "schedule": "/api/schedules",
            },
        }

    @app.get("/health", tags=["Root"])
    async def health_check():
        """Health check endpoint for monitoring."""
        return {"status": "healthy", "version": settings.API_VERSION}

    return app


# Create the application instance
app = create_app()
