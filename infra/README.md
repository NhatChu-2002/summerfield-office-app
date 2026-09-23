# Summerfield HQ infrastructure

## Services

| Service | Source | Render type | Status |
| --- | --- | --- | --- |
| `summerfield-hq-frontend` | `frontend/` | Static Site: `npm ci && npm run build`, serves `dist/` | Defined, not connected |
| `summerfield-hq-api` | `backend/api/` | Web Service (Python): `uvicorn app.main:app`, health check `/health` | Commented out until needed |
| Database | `backend/supabase/migrations/` | Supabase project shared with the inventory app | Migrations applied by hand |

## Environments

| Environment | Supabase project | Frontend | API |
| --- | --- | --- | --- |
| Local | Test project | `npm run dev` in `frontend/` | `uvicorn` in `backend/api/` |
| Production | Production project | Render Static Site | Render Web Service (when enabled) |

Add a staging environment (a separate Supabase project and Render services) before HQ has many users. Until then, the test project stands in for staging.

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
4. Apply any pending migrations from `backend/supabase/migrations/` to production (after testing them on the test project).
5. Open the site, sign in with a real account, and check that the dashboard, a department page, and task create/complete all work.
6. Add the site's URL to Supabase Auth's allowed redirect URLs, if sign-in redirects are used later.

## Deploying changes

- **Frontend or API:** merge to `main`. Render rebuilds only the service whose `rootDir` changed.
- **Database:** apply the new migration first, then merge the code that depends on it.

## Rollback

- **Frontend or API:** in the Render dashboard, redeploy the previous successful deploy. It's worth keeping auto-deploy on only for `main`.
- **Database:** write a new migration that reverses the change. Never edit or delete an applied migration. Take a backup before any destructive migration.

## Hardening still to do

- A Content-Security-Policy header. It needs the Supabase URL and any font or CDN origins listed.
- Uptime monitoring on the frontend URL and the API's `/health`.
- Error reporting for the frontend and API.
