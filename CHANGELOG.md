# Changelog

All notable changes to this project will be documented in this file.

### Fixed

- **Continue Watching Duplicates**: Fixed issue where watching multiple episodes of the same anime would create duplicate entries in the continue watching section. Now only displays one entry per anime showing the most recently watched episode with updated playback progress.

### Added

- **One-Click Installer**: Added `install-app.bat` to automatically install both backend and frontend dependencies
  - Automatically detects and uses Python (supports both `python` and `py` launcher)
  - Creates virtual environment if it doesn't exist
  - Installs all required packages
- **Installation Guide**: Added `INSTALL.md` with prerequisites and quick start instructions
