# 5. User vs non-user (guest)

MapMe supports two main modes: **signed-in user** and **guest** (non-user). The Planner is available in both; **cloud features** require an account and Supabase.

## Guest (non-user)

**How to become a guest:** On the home screen, click **Continue as guest**. You land on the **Planner** without creating an account.

### What guests can do

- Use **Planner**: start location, **2–10 stops**, **Round trip** / **One way**, **Optimize Route**.
- View **optimized routes** on the map, read **time** and **distance**, switch **alternative routes**, and click **Optimize New Route** for a new plan.
- Use **Feedback** and other routes that are not wrapped in `RequireAuth` (depends on your build).
- Adjust **theme** / light mode where the UI exposes it on guest-capable screens.

### What guests cannot do (typical)

- **History** — Sidebar item shows a **lock**; tooltip: **Sign in to access**. No cloud list of past trips.
- **Profile** — Locked the same way: no saved places grid, no avatar/banner management, no password change in Profile.
- **Save / star routes to the server** — The **favorite** star on the optimized summary is usually **disabled** for guests (tooltip explains why). Trips are not stored in your account.
- **Saved trips sidebar list** — The Planner **Saved trips** section applies to signed-in users with favorites; guests may see an empty state or no persisted list.

Guests may still see copy such as **“Save your routes & access history”** with **Sign in** to encourage upgrading to an account.

## Signed-in user

**How to sign in:** Use **Sign in** or **Create account** on `/` (see [chapter 1](./01-sign-up-sign-in.md)). Complete **step 2** (name + travel modes) the first time.

### What signed-in users gain

- **History** (`/route-history`) — Search, filter, sort, **Open Route**, **Save**, **Delete**, **Load more**.
- **Profile** (`/profile`) — Banner, avatar, **How you move**, **Your places**, **Change password**, appearance.
- **Planner integration** — Pick **saved places** for start and stops; **Saved trips** / starring syncs with History where the feature is enabled.
- **Persistent identity** — Same routes and places when you return on a new session (subject to Supabase and your project staying available).

## Supabase not configured

If the deployment is missing Supabase keys, **everyone** behaves like a **limited** guest for auth: no real sign-in, but **Continue as guest** may still reach the Planner when the **route API** works. History and Profile remain unavailable because there is no user record.

## Quick comparison

| Capability | Guest | Signed-in |
|------------|-------|-----------|
| Plan & optimize routes | Yes | Yes |
| Map + alternatives | Yes | Yes |
| History | No | Yes |
| Profile & saved places | No | Yes |
| Star / cloud save trip | No (typical) | Yes |
| Sign out → home | N/A | Yes |

When in doubt, use **Sign in** from the sidebar footer on the Planner if you want **History** and **Profile** unlocked.
