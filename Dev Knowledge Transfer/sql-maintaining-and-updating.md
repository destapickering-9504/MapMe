# Maintaining and updating SQL (Supabase)

All database and Storage policy SQL for saved trips, avatars, and related RPCs lives under **`route-optimizer/supabase/`**.

## Layout

| Path | Role |
|------|------|
| `tables/*.sql` | DDL for app tables (e.g. `saved_trips`), indexes, **RLS** policies |
| `storage/*.sql` | `storage.buckets` and `storage.objects` policies (profile/cover images) |
| `functions/*.sql` | Postgres functions exposed as **RPC** to the client (e.g. paginated history) |
| `schema.sql` | **Generated** bundle — do not hand-edit; regenerate from modules |
| `build-schema.sh` | Concatenates modules into `schema.sql` in a fixed order |

Apply order in production matches the bundle: **tables → storage → functions** (RPCs may read tables).

## Updating existing SQL

1. **Edit the source module** under `tables/`, `storage/`, or `functions/` — not `schema.sql` directly.
2. **Regenerate the bundle** from the repo (macOS/Linux):

   ```bash
   cd route-optimizer/supabase
   ./build-schema.sh
   ```

   Commit both the edited module **and** the updated `schema.sql` so the “paste whole file” workflow stays in sync.

3. **Apply in Supabase**  
   - **New project / greenfield:** SQL Editor → paste **`schema.sql`** (or run modular files in the order documented in `build-schema.sh`).  
   - **Existing project:** Prefer **incremental** snippets (e.g. only the new `alter table` or a new function file) to avoid replaying destructive or idempotent-but-noisy statements. The route-optimizer README calls out cases like “run only `list_saved_trips_page.sql` if the table already exists.”

4. **RLS and policies**  
   Any new table that holds user data should use **row level security** and policies scoped with `auth.uid()`. Mirror patterns in `tables/saved_trips.sql`. After policy changes, verify with a real JWT (anon key is not enough for user rows — test in the app or with a user session).

5. **Storage**  
   Bucket names and path conventions (`{user_id}/avatar`, etc.) must match what the frontend expects. If you rename buckets or policies, update **`route-optimizer/README.md`** and any `VITE_*` bucket env vars documented there.

## Creating new SQL artifacts

- **New table:** Add `tables/your_feature.sql`, then extend `build-schema.sh` to `cat` it in the right order (after dependencies, before RPCs that reference it), and document the new section markers in the header comment of `build-schema.sh` and the generated `schema.sql` preamble.
- **New RPC:** Add `functions/your_rpc.sql`, wire it into `build-schema.sh`, regenerate `schema.sql`, and update the TypeScript client (e.g. `savedTripsClient` or similar) to call `supabase.rpc('your_rpc', …)` with typed params.
- **Migrations vs. bundle:** This repo favors **checked-in SQL files + optional bundle** for the Supabase SQL Editor, not the Supabase CLI migration folder. If you adopt CLI migrations later, keep this folder as documentation or migrate content explicitly.

## Coordination with the app

- **JSON payloads** stored in columns (e.g. `saved_trips.payload`) must stay compatible with **`OptimizeResponse`** (or whatever the frontend serializes). Breaking changes require a **version field** in JSON or a coordinated backend + frontend release.
- After RPC signature changes, update **frontend** callers and **tests**; after RLS changes, smoke-test **sign-in**, **insert**, **select**, and **delete** paths.

## References

- [`route-optimizer/supabase/build-schema.sh`](../route-optimizer/supabase/build-schema.sh)
- [`route-optimizer/README.md`](../route-optimizer/README.md) (Supabase setup, OTP email, common errors)
