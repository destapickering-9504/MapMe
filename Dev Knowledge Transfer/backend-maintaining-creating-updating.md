# Maintaining, creating, and updating the backend

The API is **`route-optimizer/backend`**: Python 3.9+, FastAPI, Pydantic v2, httpx for outbound HTTP (geocoding / OSRM). Entrypoint: **`app.main:app`**.

## Daily workflow

```bash
cd route-optimizer/backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

From **`route-optimizer/`** (with `uvicorn` on `PATH`): `npm run dev:backend`.

Health check: **`GET /health`**.

## Layout

| Area | Purpose |
|------|---------|
| `app/main.py` | FastAPI app, **CORS** allowlist, router registration |
| `app/api/` | **Routers** — thin HTTP layer, validation via Pydantic models |
| `app/domain/` | **Models**, pure types, helpers (e.g. `stop_query`, `places`) |
| `app/services/` | **Business logic** — optimizer, matrix, providers, geocoder adapters |
| `app/core/config.py` | **Settings** from environment (`PROVIDER_MODE`, public URLs, timeouts, etc.) |
| `tests/unit/` | Fast, isolated tests |
| `tests/integration/` | API tests against the app |

New behavior should stay **thin at the router**, **typed in domain**, and **implemented in services** unless it is trivial.

## Creating a new endpoint

1. Add or extend **Pydantic models** in `app/domain/models.py` (or a focused module if the surface grows).
2. Implement logic in **`app/services/`** (and add **`tests/unit/`**).
3. Create **`APIRouter`** in `app/api/your_feature.py` with `prefix="/api"` (or a sub-prefix consistent with existing routes).
4. **`include_router`** in [`app/main.py`](../route-optimizer/backend/app/main.py).
5. Add **`tests/integration/test_*_endpoint.py`** for status codes and response shape.
6. If the frontend calls it, extend **`route-optimizer/frontend`** API client and types; document env vars if any.

## Maintaining the optimizer and providers

- **Provider mode:** `PROVIDER_MODE=public|local` switches implementations built in **`provider_factory`** / geocoder modules. Keep defaults safe for local dev (public OSM/OSRM).
- **Timeouts and limits** live in config; tune via env rather than hardcoding in services.
- **Breaking API changes** to `POST /api/optimize` request/response must stay aligned with **`OptimizeRequest` / `OptimizeResponse`** and the frontend **`optimizeClient`** and saved-trip payload shape.

## CORS

[`CORSMiddleware`](../route-optimizer/backend/app/main.py) lists allowed dev origins (Vite ports). When adding a new local port or deployed frontend origin, update **`allow_origins`** (or move to env-driven list for staging/production).

## Testing and coverage

- **`pyproject.toml`** runs pytest with **`--cov=app --cov-branch --cov-fail-under=85`**.
- Any new module under `app/` needs **tests** until coverage stays green; prefer **unit tests** for algorithms and **integration tests** for HTTP contracts.
- Run: `cd route-optimizer/backend && pytest` (or `npm run test:backend` from `route-optimizer/`).

## Dependencies

- Pin runtime deps in **[`pyproject.toml`](../route-optimizer/backend/pyproject.toml)**; use **`pip install -e ".[dev]"`** after edits.
- Security or behavior changes in **FastAPI/Pydantic/httpx** may require small router or model updates — run the full test suite.

## Related docs

- [`route-optimizer/README.md`](../route-optimizer/README.md) — optimize API body/response overview, public provider defaults  
- [`Dev Knowledge Transfer/frontend-maintaining-creating-updating.md`](./frontend-maintaining-creating-updating.md) — `VITE_API_URL` and client usage  
