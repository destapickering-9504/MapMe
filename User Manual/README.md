# MapMe — User Manual

Welcome to **MapMe**, a web app for planning multi-stop routes and choosing an efficient order for your errands.

This folder explains how to sign in, use the **Planner**, review **History**, manage your **Profile**, and what changes when you browse as a **guest** versus a signed-in user.

## Sections

| # | Topic | File |
|---|--------|------|
| 1 | Sign up & sign in | [01-sign-up-sign-in.md](./01-sign-up-sign-in.md) |
| 2 | Planner | [02-planner.md](./02-planner.md) |
| 3 | History | [03-history.md](./03-history.md) |
| 4 | Profile | [04-profile.md](./04-profile.md) |
| 5 | User vs non-user (guest) | [05-user-vs-non-user.md](./05-user-vs-non-user.md) |

## Screenshots

Illustrations live in [`images/`](./images/): **`01-sign-in`**, **`02-sign-up`**, **`03-optimized-route`**, **`04-planner-guest-sidebar`**, **`05-planner-saved-places`**, **`history.png`** (History), **`profile.png`** (Profile). Paths in each chapter are relative to that chapter’s `.md` file.

## Requirements

- A modern browser (Chrome, Safari, Firefox, or Edge).
- For **accounts**, **saved trips**, and **History**: the app must be configured with Supabase (your host sets this). Without it, you can still use the Planner as a guest when the route API is available.

For developers: see the repository [`README.md`](../README.md) and [`route-optimizer/README.md`](../route-optimizer/README.md).
