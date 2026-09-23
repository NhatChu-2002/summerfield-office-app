# Summerfield HQ

Summerfield Tea Bar's internal workspace: department dashboards, tasks, team updates, a team calendar, and Sunny the mascot. It is replacing the Streamlit inventory app (`../inventory-app`) one workflow at a time. Both apps use the same Supabase accounts and department memberships.

## Parts

| Folder | What it is | Guide |
| --- | --- | --- |
| `frontend/` | React + TypeScript app, built with Vite | [frontend/CLAUDE.md](frontend/CLAUDE.md), [frontend/README.md](frontend/README.md) |
| `backend/supabase/` | Database schema, access policies (RLS), and functions | [backend/CLAUDE.md](backend/CLAUDE.md) |
| `backend/api/` | FastAPI service for integrations and server-side jobs (skeleton) | [backend/CLAUDE.md](backend/CLAUDE.md) |
| `infra/` | Render deployment Blueprint, environments, runbook | [infra/README.md](infra/README.md) |
| `docs/design/` | Vy's design prototype and the design QA log | [docs/README.md](docs/README.md) |

Each part builds, tests, and deploys on its own. [CLAUDE.md](CLAUDE.md) explains the architecture and the rules for working on one part at a time.

## Quick start (frontend)

1. Apply `backend/supabase/migrations/*.sql` to a **test** Supabase project that already has the inventory app's schema.
2. In `frontend/`, copy `.env.example` to `.env.local`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for that test project.
3. In `frontend/`, run `npm ci`, then `npm run dev`.

To see every screen without an account, use **Preview the HQ design** on the sign-in page (development builds only).

## Deployment

HQ isn't connected to a Git remote or to Render yet. `infra/render.yaml` describes the services, and `infra/README.md` has the first-deploy steps. The inventory app's existing deployment is not affected.
