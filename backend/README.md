# Aniways Backend

A FastAPI-based backend for anime streaming, providing data from MyAnimeList (via Jikan API) and video sources from Animepahe.

## Features

- **MyAnimeList Integration** - Anime metadata, search, seasons, schedule via Jikan API
- **Animepahe Scraper** - Video source extraction with DDoS-Guard bypass
- **Kwik Extractor** - Decodes obfuscated video URLs from kwik.cx
- **Caching** - In-memory TTL cache to reduce API calls
- **CORS Proxy** - Proxies video streams to bypass browser restrictions

## Quick Start

### Prerequisites

- Python 3.11+
- pip or uv package manager

### Installation

```bash
# Clone and navigate to backend
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### Running

```bash
# Development (with auto-reload)
python server.py

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Configuration

Configuration is managed via environment variables with sensible defaults:

| Variable             | Default                    | Description                                |
| -------------------- | -------------------------- | ------------------------------------------ |
| `DEBUG`              | `false`                    | Enable debug mode with verbose logging     |
| `HOST`               | `0.0.0.0`                  | Server bind host                           |
| `PORT`               | `8000`                     | Server bind port                           |
| `API_TITLE`          | `Aniways API`              | API title in docs                          |
| `JIKAN_BASE_URL`     | `https://api.jikan.moe/v4` | Jikan API base URL                         |
| `ANIMEPAHE_BASE_URL` | `https://animepahe.si`     | Animepahe base URL                         |
| `CACHE_TTL_LIST`     | `300`                      | Cache TTL for list endpoints (seconds)     |
| `CACHE_TTL_DETAIL`   | `3600`                     | Cache TTL for detail endpoints (seconds)   |
| `JIKAN_RATE_LIMIT`   | `0.35`                     | Min delay between Jikan requests (seconds) |

## Project Structure

```
backend/
├── server.py              # Entry point
├── requirements.txt       # Dependencies
├── app/
│   ├── main.py            # FastAPI application factory
│   ├── core/              # Core configuration
│   │   ├── config.py      # Settings and configuration
│   │   └── dependencies.py # Dependency injection
│   ├── utils/             # Shared utilities
│   │   ├── cache.py       # TTL cache implementation
│   │   └── matching.py    # Fuzzy string matching
│   ├── extractors/        # Video URL extractors
│   │   └── kwik.py        # Kwik.cx video extractor
│   ├── scrapers/          # Site-specific scrapers
│   │   ├── jikan.py       # Jikan API wrapper (MAL data)
│   │   └── animepahe/     # Animepahe scraper
│   │       ├── client.py  # Main scraper class
│   │       ├── search.py  # Search functionality
│   │       ├── episodes.py # Episode listing
│   │       ├── sources.py # Video source extraction
│   │       └── latest.py  # Latest releases
│   └── routes/            # API endpoints
│       ├── mal.py         # MyAnimeList/Jikan routes
│       ├── animepahe.py   # Animepahe routes
│       └── watch.py       # Watch/video source routes
```

## API Reference

### MAL Endpoints (`/api`)

#### Top Anime

```
GET /api/top/anime?filter=airing&page=1&limit=25&type=tv
```

| Param    | Default  | Description                                      |
| -------- | -------- | ------------------------------------------------ |
| `filter` | `airing` | `airing`, `upcoming`, `bypopularity`, `favorite` |
| `page`   | `1`      | Page number (≥1)                                 |
| `limit`  | `25`     | Results per page (1-50)                          |
| `type`   | -        | `tv`, `movie`, `ova`, `special`, `ona`, `music`  |

#### Browse Anime

```
GET /api/browse/anime?status=airing&order_by=score&sort=desc&page=1&limit=25
```

| Param      | Default | Description                                            |
| ---------- | ------- | ------------------------------------------------------ |
| `status`   | -       | `airing`, `complete`, `upcoming`                       |
| `order_by` | -       | `score`, `popularity`, `rank`, `members`, `start_date` |
| `sort`     | `desc`  | `asc`, `desc`                                          |
| `page`     | `1`     | Page number (≥1)                                       |
| `limit`    | `25`    | Results per page (1-25)                                |

#### Search Anime

```
GET /api/anime?q=naruto&page=1&limit=25
```

| Param   | Default | Description             |
| ------- | ------- | ----------------------- |
| `q`     | -       | Search query (required) |
| `page`  | `1`     | Page number (≥1)        |
| `limit` | `25`    | Results per page (1-25) |

#### Anime Details

```
GET /api/anime/{mal_id}
GET /api/anime/{mal_id}/recommendations?limit=12
GET /api/anime/{mal_id}/characters?limit=12
```

| Param   | Default | Description        |
| ------- | ------- | ------------------ |
| `limit` | `12`    | Max results (1-50) |

#### Seasons

```
GET /api/seasons/now?limit=25
GET /api/seasons/upcoming?page=1&limit=25
GET /api/seasons/{year}/{season}?limit=25
```

| Param    | Values                               |
| -------- | ------------------------------------ |
| `year`   | e.g., `2024`                         |
| `season` | `winter`, `spring`, `summer`, `fall` |
| `limit`  | Results per page (1-50)              |

#### Schedule

```
GET /api/schedules?filter=monday&page=1
```

| Param    | Default | Description                  |
| -------- | ------- | ---------------------------- |
| `filter` | -       | `monday`-`sunday`, `unknown` |
| `page`   | `1`     | Page number (≥1)             |

---

### Animepahe Endpoints (`/api/animepahe`)

#### Latest Releases

```
GET /api/animepahe/latest?page=1&limit=12
```

| Param   | Default | Description             |
| ------- | ------- | ----------------------- |
| `page`  | `1`     | Page number (≥1)        |
| `limit` | `12`    | Results per page (1-50) |

#### Cookies (DDoS-Guard Bypass)

```
POST /api/animepahe/cookies
Body: {"__ddg1": "...", "__ddg2_": "...", "SERVERID": "..."}

GET /api/animepahe/cookies
```

Returns truncated cookie values for verification.

#### Search

```
GET /api/animepahe/search?q=naruto
```

| Param | Description             |
| ----- | ----------------------- |
| `q`   | Search query (required) |

#### Episodes

```
GET /api/animepahe/anime/{uuid}/episodes?page=1
```

| Param  | Default | Description          |
| ------ | ------- | -------------------- |
| `uuid` | -       | Animepahe anime UUID |
| `page` | `1`     | Page number (≥1)     |

#### Video Sources

```
GET /api/animepahe/episode/{uuid}/{session}/sources
```

| Param     | Description          |
| --------- | -------------------- |
| `uuid`    | Animepahe anime UUID |
| `session` | Episode session ID   |

#### Video Extraction

```
GET /api/animepahe/extract?url=https://kwik.cx/e/...
```

Extracts m3u8 URL from kwik embed.

#### CORS Proxy

```
GET /api/animepahe/proxy?url=https://...
```

Proxies m3u8 playlists and video segments to bypass CORS.

---

### Watch Endpoints (`/api`)

#### Watch Episode

```
GET /api/watch/{mal_id}/{episode}?quality=1080
```

| Param     | Default | Description                             |
| --------- | ------- | --------------------------------------- |
| `mal_id`  | -       | MyAnimeList anime ID                    |
| `episode` | -       | Episode number                          |
| `quality` | `1080`  | Preferred quality (1080, 720, 480, 360) |

Returns video sources for a specific episode, automatically matching MAL to Animepahe.

#### All Episode Sources

```
GET /api/anime/{mal_id}/sources
```

Returns all episodes with their video sources. **Warning**: Slow for long series.

#### Animepahe Match

```
GET /api/anime/{mal_id}/animepahe
```

Returns Animepahe match info for a MAL ID (uuid, title match, episode count).

## DDoS-Guard Bypass

Animepahe uses DDoS-Guard protection. To access it, you need to provide valid cookies:

1. Visit [animepahe.si](https://animepahe.si) in your browser
2. Open DevTools (F12) → Application → Cookies
3. Copy all cookie values
4. POST them to `/api/animepahe/cookies`:

```bash
curl -X POST http://localhost:8000/api/animepahe/cookies \
  -H "Content-Type: application/json" \
  -d '{"__ddg1": "...", "__ddg2_": "...", "SERVERID": "..."}'
```

Cookies typically need to be refreshed periodically (every few hours).

## Rate Limiting

- **Jikan API**: Max 3 requests/second (configurable via `JIKAN_RATE_LIMIT`)
- **Animepahe**: Batch processing with 500ms delays between batches

## Caching

The backend uses in-memory caching to reduce load:

- **List endpoints** (top, browse, search): 5 minutes
- **Detail endpoints** (anime, recommendations): 1 hour
- **Animepahe responses**: Not cached (real-time)

## Development

### Adding New Routes

1. Create route file in `app/routes/`
2. Define router with `APIRouter(prefix="...", tags=["..."])`
3. Import and include in `app/main.py`

### Error Handling

- Global exception handler returns JSON errors
- Debug mode shows full tracebacks
- Production mode shows generic error messages
