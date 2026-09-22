# Summerfield HQ

Separate product project for the Summerfield HQ application. The existing
Streamlit inventory app remains in `../inventory-app` and can continue to run
while workflows move here one at a time.

## Project map

- `web/`: React and TypeScript frontend. See `web/README.md` for local setup.
- `supabase/migrations/`: HQ-owned database changes. The first migration adds
  department tasks and updates.
- A Python API can be added when inventory calculation and external integrations
  move out of Streamlit. It is not part of this MVP yet.

## Run locally

1. Apply `supabase/migrations/202609220001_hq_mvp.sql` to a **test** Supabase
   project that already has the Summerfield organization, profile, and team
   membership schema from the inventory app. This migration is not standalone.
2. In `web/`, copy `.env.example` to `.env.local` and set the test project's
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put a database
   password or service-role key in the frontend.
3. Run `npm ci` and `npm run dev` inside `web/`.

The frontend uses the existing Supabase accounts and membership model. To keep
the projects independent, database changes owned by HQ live here; shared-schema
changes need coordination with the inventory app. Neither app requires the
other's source tree to build.

## Deployment boundary

HQ is not connected to a Git remote or Render service yet. The React frontend
can be deployed as its own Render Static Site. If an API is added later, deploy
it as a separate Render Web Service, then connect the frontend to that API.
This keeps the existing inventory deployment unchanged during migration.
