# Changelog

All notable changes to this project will be documented in this file.

## [v1.5] - 2026-01-30

### Added

- **SQLite Database**: Persistent storage using SQLAlchemy with SQLite
  - User authentication with JWT tokens (30-day expiry)
  - Anime list management (plan to watch, watching, completed, paused, dropped)
  - Optimized with WAL mode, foreign keys, and composite indexes for performance
  - Database stored in `backend/aniways.db` (locally) or `/app/data/aniways.db` (Docker)
- **Docker Database Persistence**: Volume mount `aniways-data` for persistent database storage
- **One-Click Installer**: `install-app.bat` to automatically install both backend and frontend dependencies
  - Automatically detects and uses Python (supports both `python` and `py` launcher)
  - Creates virtual environment if it doesn't exist
  - Installs all required packages
- **Installation Guide**: `INSTALL.md` with prerequisites and quick start instructions

### Changed

- **Watch Page Responsiveness**: Anime info sidebar only shows on extra-large screens (2xl+), giving more room for video player on smaller screens
- **Video Controls Layout**: Improved responsive layout to prevent button overlapping on medium-sized screens

### Fixed

- **Add to List Dropdown**: Dropdown no longer overlaps the popover card
- **Continue Watching Duplicates**: Only displays one entry per anime showing the most recently watched episode
