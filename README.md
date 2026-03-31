# MapMe

MapMe is a **local-first route planner**: enter a starting place and several stops, and the app scores visit orders to help you pick an efficient path. The web app lives under **`route-optimizer`** — React + TypeScript on the client and Python + FastAPI for geocoding and optimization.

## Features

- **Route optimizer** — Map-based planner with ordered stops, alternatives, and round-trip / one-way modes.
- **Optional sign-in** — Email OTP and profile flows via [Supabase](https://supabase.com); without it, the app still runs with local-only behavior.
- **Saved trips & history** — When Supabase is configured, routes can be persisted and browsed in History.

## Repository layout

| Path | Purpose |
|------|---------|
| [`route-optimizer/`](route-optimizer/) | Main application (frontend, backend, Supabase SQL) |
| [`route-optimizer/README.md`](route-optimizer/README.md) | Detailed stack, Supabase setup, API shape, and troubleshooting |

## Quick start

**Prerequisites:** Node.js 18+ (or current LTS), Python 3.9+.

### 1. Frontend

```bash
cd route-optimizer/frontend
npm install
npm run dev
```

Open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)). The planner is at **`/routeoptimizer`**.

### 2. Backend (recommended for full planner behavior)

```bash
cd route-optimizer/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

The frontend calls the API at **`http://localhost:8000`** by default. Override with `VITE_API_URL` in `frontend/.env.local` (see [`route-optimizer/frontend/.env.example`](route-optimizer/frontend/.env.example)).

### 3. Optional: Supabase (auth + saved data)

```bash
cd route-optimizer/frontend
cp .env.example .env.local
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project, and apply the SQL described in [`route-optimizer/README.md`](route-optimizer/README.md).

## Convenience scripts

From **`route-optimizer/`** (after backend dependencies are installed and `uvicorn` is on your `PATH`, e.g. with the venv activated):

```bash
npm run dev:frontend
npm run dev:backend
npm test                 # frontend + backend tests
```

## Tests

```bash
cd route-optimizer/frontend && npm test
cd route-optimizer/backend && pytest
```

Backend tests enforce high coverage; see the route-optimizer README for policy details.