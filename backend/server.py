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

import sys
from app.main import app
from app.core.config import settings

# Check if running as frozen executable (PyInstaller)
def is_frozen():
    return getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')

if __name__ == "__main__":
    import uvicorn
    
    if is_frozen():
        # When frozen, pass the app object directly (no reload)
        uvicorn.run(
            app,
            host=settings.HOST,
            port=settings.PORT,
            reload=False,  # Cannot reload in frozen app
            log_level="info",
        )
    else:
        # Development mode - string reference allows reload
        uvicorn.run(
            "server:app",
            host=settings.HOST,
            port=settings.PORT,
            reload=settings.DEBUG,
            log_level="debug" if settings.DEBUG else "info",
        )
