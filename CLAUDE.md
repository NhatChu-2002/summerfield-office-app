# Summerfield HQ

HQ is Summerfield Tea Bar's internal workspace: department dashboards, tasks, team updates, a team calendar, and Sunny the mascot. It replaces the Streamlit inventory app (`../inventory-app`) one workflow at a time. Both apps share one Supabase project, so they share the same accounts and department memberships.

This file covers the whole repository. Each part also has its own `CLAUDE.md` with its specific rules. Read that file before working in the part.

## Architecture

The project has three parts: the frontend, the backend, and infra. Each part builds, tests, and deploys on its own. They connect only through defined contracts, never by importing each other's code.

```
                        HTTPS · publishable key + user's session JWT
  ┌──────────────────┐ ─────────────────────────────────────────────▶ ┌──────────────────────────────┐
  │ frontend/        │                                                 │ backend/supabase/            │
  │ React SPA        │                                                 │ Supabase: Auth · Postgres    │
  │ (static files)   │                                                 │ Row Level Security · RPCs    │
  └──────────────────┘                                                 └──────────────────────────────┘
          │  HTTPS · user's session JWT                                              ▲
          ▼                                                                         │ server-side credentials
  ┌──────────────────┐                                                               │
  │ backend/api/     │ ──────────────────────────────────────────────────────────────┘
  │ FastAPI service  │   also: third-party services (Google, email, POS...)
  └──────────────────┘
  (skeleton only; not deployed yet)
```

**The database is the source of truth and the security boundary.** Row Level Security (RLS) policies and Postgres functions decide who can read or change each row. Permission checks in the frontend only hide buttons. They are never what protects data.

Where new logic goes:

| The work | Where it goes |
| --- | --- |
| Simple reads and writes that RLS can protect | Frontend calls Supabase directly, in the feature's `api.ts` |
| Rules that must hold together in one transaction (such as a task status change with a revision check) | A Postgres function (RPC) in a migration |
| Anything that needs a secret, calls a third-party service, runs on a schedule, or does heavy computation | `backend/api` |
| Deployment, hosting, CI | `infra/` and `.github/workflows/` |

The contracts between the parts:
- **Frontend ↔ database:** table columns, RLS policies, and RPC names and arguments. They are defined in `backend/supabase/migrations/`, and TypeScript types mirror them in `frontend/src/features/*/api.ts`.
- **Frontend ↔ API:** the HTTP endpoints. FastAPI serves OpenAPI at `/docs` outside production.
- **Department codes** appear in three places, which must stay in sync:
  - the database check constraints
  - `frontend/src/shared/config/departments.ts`
  - `frontend/src/shared/config/reference-departments.ts`

## Repository map

```
summerfield-hq/
├── CLAUDE.md                 you are here
├── README.md                 short human overview and quick start
├── frontend/                 React + TypeScript + Vite app            → frontend/CLAUDE.md
│   ├── src/app/              composition: providers, the sign-in gate, the route table
│   ├── src/features/         one folder per product area, each with a public index.ts
│   │                         (auth, dashboard, departments, tasks, updates, calendar, workspace, sunny)
│   ├── src/shared/           no product knowledge: Supabase client, config, helpers, UI, global CSS
│   ├── public/               static assets (logo, Sunny artwork)
│   └── scripts/              one-off asset tools
├── backend/                                                           → backend/CLAUDE.md
│   ├── supabase/migrations/  database schema, RLS, and RPCs (SQL, applied in order)
│   └── api/                  FastAPI service: app/core/ (settings, health) and app/features/<name>/
├── infra/                    Render Blueprint, environments, deploy runbook → infra/CLAUDE.md
├── .github/workflows/        CI, one workflow per part, triggered by path
└── docs/design/              Vy's HTML design reference and the design QA log with screenshots
```

## Working part by part

1. **Pick one part and stay in it.** Before editing, read that part's `CLAUDE.md`. Run that part's checks, not the whole repo's.
2. **A change that crosses parts** is one that changes a contract, such as a new column the UI shows. Make it in this order:
   1. Database migration.
   2. API, if the change touches it.
   3. Frontend.

   Each step must work with the previous version of the next step. For example, add a column before the UI reads it, and never rename a column in the same release that the UI switches to the new name.
3. **Never import across part folders.** The frontend never imports from `backend/`, and the API never reads frontend files. If two parts need the same data, it goes through a contract.
4. **One concern per branch.** See "Branches and releases" below.

## Branches and releases

Code moves up one environment at a time, and only through pull requests:

```
feature/*  ──PR──▶  dev  ──PR──▶  test  ──PR──▶  stage  ──PR──▶  main
(your work)       (merged work)  (QA)          (final check)    (production)
                                                                  │
hotfix/*  ◀─── branched from main for urgent production fixes ────┘
```

| Branch | Purpose | Who merges into it | What must pass first |
| --- | --- | --- | --- |
| `feature/<short-name>` | One change, branched from `dev`. Also `fix/<name>` for bugs, `chore/<name>` for tooling. | You, by pushing | Nothing yet. Push early. |
| `dev` | Everyone's finished work, integrated | PR from a feature branch | CI green, one review |
| `test` | Release candidate for QA | PR from `dev` | CI green, and QA has tested the changes in the test environment |
| `stage` | Production copy for final sign-off | PR from `test` | Migrations rehearsed on the staging database, and the owner's approval |
| `main` | Production. Every commit here is live or about to be. | PR from `stage`, or from `hotfix/*` | Staging approved. Tag the release. |

Rules:
- **Never commit directly to `dev`, `test`, `stage`, or `main`.** Protect them on GitHub: require pull requests and passing CI, and block force-pushes.
- **Branch from `dev`, and keep your branch current** by merging `dev` into it. Delete the branch after it merges.
- **Promotion PRs (`dev`→`test`, `test`→`stage`, `stage`→`main`) carry no new code.** If something breaks while testing, fix it on a `fix/*` branch into `dev` and promote again.
- **Hotfixes** branch from `main` and go back into `main` by PR. Then merge `main` back down into `stage`, `test`, and `dev`, so the fix isn't lost at the next release.
- **Releases:** after merging to `main`, tag it `vYYYY.MM.DD` (add `.2`, `.3` for more than one release in a day). Write what changed in the GitHub release notes.
- **Commit messages** start with a verb in the imperative ("Add calendar persistence"), with a body explaining why when that isn't obvious.

## Commands

| Part | Where | Install | Check | Run |
| --- | --- | --- | --- | --- |
| Frontend | `frontend/` | `npm ci` | `npm run typecheck`, `npm run check:boundaries`, `npm test`, `npm run build` | `npm run dev` (Vite prints the local URL) |
| API | `backend/api/` | `python -m venv .venv`, then `.venv/Scripts/pip install -r requirements-dev.txt` (on macOS or Linux, use `.venv/bin/`) | `.venv/Scripts/python -m pytest -W error` | `.venv/Scripts/uvicorn app.main:app --reload` |
| Database | `backend/supabase/` | none | Apply migrations to a **test** Supabase project first | none |

## Rules that apply everywhere

- **Secrets never go in git or in the frontend.** The browser only gets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Service-role keys, database passwords, and third-party tokens live only in the API host's environment settings. Local values go in `.env` or `.env.local` files, which are gitignored. Each part has a `.env.example` with placeholders only.
- **Production data is never used for testing.** Use a separate test Supabase project.
- **The shared schema belongs to both apps.** Tables such as `organizations`, `user_profiles`, `organization_memberships`, and `team_report_memberships` come from the inventory app. Changing them needs coordination with `../inventory-app`. HQ-owned tables use the `hq_` prefix.
- **Don't fake it.** Screens that aren't connected yet say so. Nothing may pretend to save.
- **Accessibility and phone widths are part of "done":** keyboard access, visible focus, respect for reduced motion, and no horizontal scroll at 375px.
- **Match the code around you.** Follow the local naming, comment density, and idiom. Comments explain why, not what.

## Definition of done

- The checks for every part you touched pass: type-check, tests, and build.
- UI changes have been viewed in a browser at desktop and phone widths, with no console errors. Use **Design preview** to see screens without company data.
- Database changes have been applied to a test project, and read and write access has been tried as each role it affects.
- Docs are updated when behaviour or a contract changes: this file, the part's `CLAUDE.md` or README, and `docs/design/qa/design-qa.md` for design work.

## Decisions so far

- **Supabase as the backend, with the browser calling it directly** for CRUD protected by RLS. There is no API hop for simple reads.
- **A separate Python API** for integrations, secrets, and the inventory calculations that will move out of Streamlit. Python was chosen because the inventory logic is already Python.
- **Hash routing (`#/path`)**, so the frontend deploys as plain static files with no rewrite rules.
- **Render hosting:** a Static Site for the frontend and a Web Service for the API, described in `infra/render.yaml`.
- **Feature folders on both sides.** In the frontend and the API alike, a feature's UI or routes, data access, rules, and tests sit together behind one public entry point (`index.ts` in the frontend, the feature's router in the API), so each feature can be worked on alone. The frontend's import rules are checked by `npm run check:boundaries`.
- **`docs/design/reference/Summerfield HQ.html`** (Vy's prototype) is the visual reference. It is not runtime code.
