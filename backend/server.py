"""
Aniways API - Entry Point
=========================

Production server entry point using Uvicorn.

Usage:
    Development:    python server.py
    Production:     uvicorn server:app --host 0.0.0.0 --port 4444 --workers 4

Environment Variables:
    HOST    - Server host (default: 127.0.0.1)
    PORT    - Server port (default: 4444)
    DEBUG   - Enable debug mode (default: false)
"""

from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
