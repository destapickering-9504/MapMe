# Route Optimizer

Local-first store route optimizer built with React + FastAPI.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Python + FastAPI
- Tests: Vitest + Pytest
- Coverage policy: 85% line and branch minimum

## Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## Test

```bash
cd frontend && npm test
cd backend && pytest
```

Backend tests enforce branch + line coverage using `--cov-branch --cov-fail-under=85`.

## Free Public Providers (Default)

The backend default mode uses free public APIs:

- Geocoding: OpenStreetMap Nominatim search endpoint (ZIP, city, or town for the starting location)
- Routing matrix: OSRM public table endpoint

### Optimize API

`POST /api/optimize` JSON body:

- `origin_place` (string): ZIP code or town/city name (geocoded server-side)
- `stores` (string array, 2–10): any store names or chains you want; each is geocoded near the start
- `trip_mode` (string): `round_trip` or `one_way`

Response highlights:

- `origin_query` / `origin_address`: what you typed and the resolved address
- `stops_resolved`: each store’s search text plus resolved address (input order)
- `permutations_considered`: `n!` — every visit order is scored for `n` stores
- `best_route` / `alternatives`: ordered stops with names and full addresses

Optional environment variables for backend:

- `PROVIDER_MODE=public|local`
- `PUBLIC_GEOCODE_URL` (default `https://nominatim.openstreetmap.org/search`)
- `PUBLIC_ROUTING_URL` (default `https://router.project-osrm.org/table/v1/driving`)
- `PUBLIC_REQUEST_TIMEOUT_SECONDS` (default `8`)
- `PUBLIC_GEOCODER_LIMIT` (default `5`)
- `PUBLIC_USER_AGENT` (default `route-optimizer-local/0.1`)
