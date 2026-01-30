<img width="1584" height="396" alt="Untitled design (2)" src="https://github.com/user-attachments/assets/22ee2675-bff8-48e2-b656-994245aa613a" />

<div align="center">

# Aniways

A modern anime streaming application built with Next.js, FastAPI and Electron.

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" width="40" height="40" title="Next.js"/> &nbsp;&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg" width="40" height="40" title="FastAPI"/> &nbsp;&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/electron/electron-original.svg" width="40" height="40" title="Electron"/> &nbsp;&nbsp;

[![GitHub stars](https://img.shields.io/github/stars/hazavi/aniways?style=social)](https://github.com/hazavi/aniways/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/hazavi/aniways?style=social)](https://github.com/hazavi/aniways/fork)
[![GitHub issues](https://img.shields.io/github/issues/hazavi/aniways)](https://github.com/hazavi/aniways/issues)

## Preview

https://github.com/user-attachments/assets/0339b4af-6562-42b0-bab2-4c583a4c93f0

## Quick Install Tutorial

https://github.com/user-attachments/assets/e5c7999c-f719-428b-9d80-9bdf21ec44b2

</div>

## Disclaimer

This project is for educational and personal use only.

- I am not responsible for any misuse of this software
- This application does not host or store any media files on its servers
- All content is streamed from third-party providers
- Use at your own risk

---

## Overview

Aniways provides anime metadata from MyAnimeList (via Jikan API) and video sources from Animepahe. The backend handles data fetching, caching, and video URL extraction while the frontend delivers a responsive viewing experience.

### Features

- **Stream Anime** - Watch from Animepahe sources with quality selection
- **Anime Lists** - Track your anime (Plan to Watch, Watching, Completed, Paused, Dropped)
- **User Accounts** - Register and login with JWT authentication
- **Continue Watching** - Resume from where you left off
- **Search & Browse** - Find anime by name, genre, season, or schedule
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Desktop App** - Run as a standalone Electron application

## Project Structure

```
aniways/
├── backend/
│   ├── server.py              # Entry point
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # FastAPI application
│       ├── config.py          # Configuration
│       ├── dependencies.py    # Dependency injection
│       ├── routes/
│       │   ├── mal.py         # MAL/Jikan endpoints
│       │   ├── animepahe.py   # Animepahe endpoints
│       │   └── watch.py       # Video source endpoints
│       └── services/
│           ├── mal.py         # Jikan API service
│           ├── animepahe.py   # Animepahe scraper
│           └── kwik.py        # Video URL extractor
│
└── frontend/
    ├── package.json
    ├── electron/              # Electron desktop app
    │   ├── main.js            # Main process
    │   └── preload.js         # Preload script
    ├── app/                   # Next.js pages
    │   ├── page.tsx           # Home
    │   ├── anime/[id]/        # Anime details
    │   ├── watch/[id]/[ep]/   # Video player
    │   ├── search/            # Search results
    │   ├── browse/            # Browse by category
    │   └── schedule/          # Weekly schedule
    ├── components/            # React components
    └── lib/                   # Utilities and API client
```

---

## Backend

FastAPI server providing anime data and video sources.

### Requirements

- Python 3.11+

### Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### Run

```bash
python server.py
```

Server runs at `http://localhost:4444`

### API Documentation

- Swagger UI: `http://localhost:4444/docs`
- ReDoc: `http://localhost:4444/redoc`

### API Endpoints

| Endpoint                            | Description                           |
| ----------------------------------- | ------------------------------------- |
| GET /api/top/anime                  | Top anime (airing, upcoming, popular) |
| GET /api/browse/anime               | Browse with filters                   |
| GET /api/anime?q=                   | Search anime                          |
| GET /api/anime/{id}                 | Anime details                         |
| GET /api/anime/{id}/recommendations | Recommendations                       |
| GET /api/anime/{id}/characters      | Characters                            |
| GET /api/seasons/now                | Current season                        |
| GET /api/schedules                  | Weekly schedule                       |
| GET /api/watch/{id}/{episode}       | Video sources                         |
| GET /api/animepahe/latest           | Latest releases                       |
| POST /api/auth/register             | Create new account                    |
| POST /api/auth/login                | Login and get JWT token               |
| GET /api/list                       | Get user's anime list                 |
| POST /api/list                      | Add anime to list                     |

### DDoS-Guard Cookies

Animepahe requires DDoS-Guard bypass cookies. To update:

1. Visit animepahe.si in browser
2. Open DevTools > Application > Cookies
3. POST cookies to `/api/animepahe/cookies`

---

## Frontend

Next.js application with Tailwind CSS and shadcn/ui.

### Requirements

- Node.js 18+

### Setup

```bash
cd frontend
npm install
```

### Run

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Pages

| Route                 | Description               |
| --------------------- | ------------------------- |
| /                     | Home with featured anime  |
| /anime/[id]           | Anime details page        |
| /watch/[id]/[episode] | Video player              |
| /search               | Search results            |
| /browse/[category]    | Browse by category        |
| /schedule             | Weekly broadcast schedule |
| /season/upcoming      | Upcoming anime            |
| /profile              | User profile & anime list |
| /login                | Login page                |
| /signup               | Registration page         |

---

## Tech Stack

### Backend

- FastAPI - Web framework
- SQLAlchemy - ORM with SQLite database
- httpx - Async HTTP client
- BeautifulSoup4 - HTML parsing
- Jikan API - MyAnimeList data
- JWT - User authentication

### Frontend

- Next.js 15 - React framework
- TypeScript - Type safety
- Tailwind CSS 4 - Styling
- shadcn/ui - UI components
- HLS.js - Video streaming

### Desktop App

- Electron - Cross-platform desktop app
- Electron Forge - Build & packaging

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4444`

To rebuild after changes:

```bash
docker-compose up -d --build
```

### Option 2: Startup Script

**Windows:**

```bash
start.bat
```

**Linux/Mac:**

```bash
chmod +x start.sh
./start.sh
```

### Option 3: Electron Desktop App

Run as a standalone desktop application:

```bash
cd frontend
npm install
npm run electron:dev
```

or

```bash
./start-app.bat
```

This starts both the Next.js server and the Python backend automatically, then opens the Electron window.

**Build Desktop App:**

```bash
cd frontend
npm run electron:build
```

or

```bash
./build-app.bat
```

The packaged app will be in `frontend/out/make/`.

### Option 4: Manual

1. Start backend:

   ```bash
   cd backend
   python server.py
   ```

2. Start frontend (new terminal):

   ```bash
   cd frontend
   npm run dev
   ```

3. Open `http://localhost:3000`

---

## License

MIT
