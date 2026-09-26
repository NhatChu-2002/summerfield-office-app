# Summerfield HQ infrastructure

## Services

| Service | Source | Render type | Status |
| --- | --- | --- | --- |
| `summerfield-hq-frontend` | `frontend/` | Static Site: `npm ci && npm run build`, serves `dist/` | Defined, not connected |
| `summerfield-hq-api` | `backend/api/` | Web Service (Python): `uvicorn app.main:app`, health check `/health` | Commented out until needed |
| Database | `backend/supabase/migrations/` | Supabase project shared with the inventory app | Migrations applied by hand |

## Environments

Code moves through `dev` → `test` → `stage` → `main` by pull request, but these branches do **not** currently have separate hosted environments. The user has chosen one hosted Supabase project, shared with the inventory app until HQ replaces it. Do not treat a Git branch or `APP_ENV=development` as database isolation.

| Branch | Purpose | Database for write tests | Hosting status |
| --- | --- | --- | --- | --- |
| `feat/*` | Local implementation | Isolated local Supabase stack with synthetic data | Local Vite/API only |
| `dev` | Integrated code | Isolated local stack manually; database CI pending | No separate Render service confirmed |
| `test` | QA candidate | Local stack plus explicit QA plan | No separate Render service confirmed |
| `stage` | Final code sign-off | Local migration rehearsal and backup plan | No separate Render service confirmed |
| `main` | Production code | Never a fixture or test database | Render Blueprint defined, not connected |

- The single hosted project is labeled production. Both local app configurations currently point to it; do not use those configurations for write-based tests.
- Docker Desktop and an unlinked local Supabase QA stack are available on this workstation. A second, stopped local project replayed the current 46-file inventory/HQ schema sequence from scratch and passed 56 synthetic RLS/report assertions, with one production-data inventory seed explicitly excluded. CI still lacks a cross-repository inventory migration checkout; do not promote database-dependent code for deployment until that gap and hosted migration history are addressed.
- A second hosted project is optional in the future. If added, it must use synthetic data, not a copy of production personnel or customer data.

## Environment variables

| Variable | Used by | Secret | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend build | No | Project URL. It is built into the static files. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend build | No | Publishable (anon) key only. Never the service-role key. |
| `NODE_VERSION` | Frontend build | No | `24`. The test runner needs Node 22.18 or newer. |
| `HQ_ENVIRONMENT` | API | No | `development`, `staging`, or `production`. Production turns off `/docs`. |
| `HQ_CORS_ORIGINS` | API | No | JSON list of allowed frontend origins, for example `["https://hq.example.com"]`. |
| `PYTHON_VERSION` | API build | No | `3.12.9` |

Secrets the API will need later, such as the Supabase service-role key and integration tokens, get added here when their endpoints are built. Never add them to the frontend.

## First deploy

1. Push the repository to GitHub.
2. In Render, create a **Blueprint** from the repository, with its file path set to `infra/render.yaml`.
3. Enter `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the production project when prompted.
4. Reconcile the hosted migration ledger against inventory's migration history. The clean combined schema/RLS replay passed locally; apply pending migrations only after the hosted ledger, excluded data seed, backup, and deployment plan are reviewed.
5. Open the site, sign in with a real account, and check that the dashboard, a department page, and task create/complete all work.
6. Add the site's URL to Supabase Auth's allowed redirect URLs, if sign-in redirects are used later.

## Deploying changes

- **Frontend or API:** promote code through `dev` → `test` → `stage` → `main` only after the checks and QA required for each step. A branch is not a deployed environment until hosting is configured and verified.
- **Database:** test the combined inventory/HQ migration sequence and RLS behavior in an isolated local stack first. Reconcile the hosted ledger, back up, and apply reviewed migrations to the single hosted project before deploying code that depends on them. Never point QA or seed scripts at that project.

## Rollback

- **Frontend or API:** in the Render dashboard, redeploy the previous successful deploy. Then fix forward with a `hotfix/*` branch, or revert the merge on `main`.
- **Database:** write a new migration that reverses the change. Never edit or delete an applied migration. Take a backup before any destructive migration.

## Hardening still to do

- A Content-Security-Policy header. It needs the Supabase URL and any font or CDN origins listed.
- Uptime monitoring on the frontend URL and the API's `/health`.
- Error reporting for the frontend and API.
