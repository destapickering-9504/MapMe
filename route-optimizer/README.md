# Route Optimizer

Local-first store route optimizer built with React + FastAPI.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Python + FastAPI
- Auth & saved trips (optional): [Supabase](https://supabase.com) (free tier)
- Tests: Vitest + Pytest
- Coverage policy: 85% line and branch minimum

## Supabase (sign-in + saved routes)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL**: In the Supabase dashboard, open **SQL Editor**, paste and run `supabase/schema.sql` from this repo (creates `saved_trips` + row-level security).
3. **API keys**: **Project Settings → API** (or **Connect**) — copy **Project URL** and the **publishable** client key (`sb_publishable_…`) or legacy **anon** JWT (`eyJ…`). Put the key in `VITE_SUPABASE_ANON_KEY` (name is historical; the value can be either key type Supabase shows for browser clients).
4. **Frontend env**: `cd frontend && cp .env.example .env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The **Postgres “direct connection”** string is only for database tools or a backend using `psql`/SQL drivers — do not put your DB password in the Vite frontend.

Without these variables, the app still runs; the header shows a short note and saved trips stay local-only.

**“Failed to fetch” when signing in:** The browser cannot reach your Supabase project. Re-copy **Project URL** from **Settings → API** into `frontend/.env.local` (must match exactly, usually `https://xxxxx.supabase.co`). Ensure the project is **not paused**, restart `npm run dev` after env changes, and try without VPN/ad blockers.

**Email (6-digit code only)**: This app uses **OTP**, not magic links: `signInWithOtp` is called **without** `emailRedirectTo`. In the Supabase dashboard, open **Authentication → Email Templates** (e.g. **Magic Link**) and put the code in the body with **`{{ .Token }}`** (you can remove or ignore `{{ .ConfirmationURL }}` if you want a code-only email). See [Email OTP / passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless).

**“Token has expired or is invalid” when verifying the code:** (1) Use **only the latest** code after **Resend** — each new email invalidates the previous one. (2) Enter the **six digits** from the email (not characters from a link URL). (3) Confirm the **Magic link** template actually includes **`{{ .Token }}`**; link-only emails have no valid OTP to type. (4) The app sends the email address **lowercased** to match Supabase.

## Frontend routes

- **`/`** — Map Me auth wizard: email + OTP, optional profile, or guest.
- **`/sign-in`**, **`/sign-up`** — Redirect to **`/`** (legacy paths).
- **`/routeoptimizer`** — Route Optimizer map and planner.

## Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173/` (or the port Vite prints). Use **`/routeoptimizer`** for the planner.

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
