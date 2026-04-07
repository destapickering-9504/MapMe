# Maintaining, creating, and updating the frontend

The UI is **`route-optimizer/frontend`**: React 18, TypeScript, Vite 5, React Router 7, Leaflet, Tailwind (with page/component-scoped CSS where used), Vitest + Testing Library.

## Daily workflow

```bash
cd route-optimizer/frontend
npm install          # after pulling package.json / lockfile changes
npm run dev          # Vite dev server (port 5173, or next free)
npm test             # Vitest + coverage thresholds
npm run build        # tsc + production bundle
```

## Configuration and environment

- **Local secrets:** Copy [`.env.example`](../route-optimizer/frontend/.env.example) to **`.env.local`** (gitignored). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for auth and saved trips; optional `VITE_API_URL` for the FastAPI origin (defaults to `http://localhost:8000` — see [`src/lib/apiBase.ts`](../route-optimizer/frontend/src/lib/apiBase.ts)).
- **Restart Vite** after changing any `VITE_*` variable.

## Architecture conventions

- **Routes** are declared in [`src/main.tsx`](../route-optimizer/frontend/src/main.tsx). Path constants live in [`src/routes/paths.ts`](../route-optimizer/frontend/src/routes/paths.ts).
- **Auth:** [`AuthContext`](../route-optimizer/frontend/src/auth/AuthContext.tsx), [`RequireAuth`](../route-optimizer/frontend/src/auth/RequireAuth.tsx), onboarding helpers under `src/auth/`.
- **API:** HTTP to the Python backend via `getApiBaseUrl()` and small clients (e.g. `optimizeClient`, `addressSuggestClient`). Supabase uses [`supabaseClient.ts`](../route-optimizer/frontend/src/lib/supabaseClient.ts) and feature clients like `savedTripsClient`.
- **Domain logic** (pure TS, no React) under `src/domain/` — prefer this for mappers, validators, and shared types used by pages and tests.
- **Layout:** `AppLayout`, `AppSidebar`, `AppRouteShell` wrap major sections; new top-level screens usually go under `src/pages/`.

## Creating new UI

1. Add a **page component** under `src/pages/` (and optional `*.css` alongside existing patterns).
2. Register the **route** in `main.tsx`; add a **path constant** if the path is reused.
3. If the screen needs login, nest it under `<RequireAuth>` like Profile and History.
4. Reuse **theme** via `ThemeContext` / `DocumentTheme` and existing Tailwind + CSS variables; match spacing and typography of nearby pages.
5. For map features, follow [`RouteMap`](../route-optimizer/frontend/src/components/RouteMap.tsx) / `react-leaflet` usage.

## Maintaining existing UI

- **Planner and history** are large; prefer **small components** and hooks over growing a single file. Shared strings and labels can move to small libs under `src/lib/` or `src/domain/`.
- **Tailwind:** `tailwind.config.js`, `postcss.config.js`, and per-area imports (e.g. `planner.tailwind.css`, `history.tailwind.css`) — keep content paths accurate if you add new folders of class usage.
- **CORS:** If the dev server port changes again, backend [`CORSMiddleware`](../route-optimizer/backend/app/main.py) allowlist may need updating.

## Testing and coverage

- Tests live in **`src/test/`** with `*.test.ts(x)` naming; shared setup in [`src/test/setup.tsx`](../route-optimizer/frontend/src/test/setup.tsx).
- **`vitest.config.ts`** enforces **85%** lines/branches globally but **excludes** several directories (pages, some components, `domain/**`, etc.). New **critical** logic should live in **included** paths (e.g. hooks, lib, tested components) or you must narrow exclusions deliberately.
- When fixing bugs, add a **regression test** if the area is testable without brittle DOM.

## Dependencies

- Bump versions in `package.json` with **lockfile** updates (`npm install`); run **`npm test`** and **`npm run build`** before merging.
- Supabase and router major upgrades may require type and API migration — check changelogs.

## Related docs

- [`route-optimizer/README.md`](../route-optimizer/README.md) — routes list, Supabase UX notes  
- [`Dev Knowledge Transfer/sql-maintaining-and-updating.md`](./sql-maintaining-and-updating.md) — when DB/RPC changes drive UI changes  
