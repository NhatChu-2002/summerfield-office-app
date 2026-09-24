# Backend

The backend has two independent pieces:

- **`supabase/`**: the database. It holds the schema, Row Level Security (RLS), and Postgres functions. **This is where HQ's data rules live today.** The frontend reads and writes through it directly.
- **`api/`**: a FastAPI service for work the browser must not do. It is a skeleton today: it only serves `/health` and is not deployed.

Read `../AGENTS.md` for repository-wide rules.

## Database (`supabase/`)

HQ shares one Supabase project with the Streamlit inventory app. The migrations here depend on objects that the inventory app's migrations create, so **they do not run on an empty database.** They need these tables:

- `organizations`
- `user_profiles`
- `organization_memberships`
- `team_report_memberships`

And these functions and types:

- `has_org_role()`
- `has_team_report_role()`
- `app_role`

### Migrations

- **Name new files `YYYYMMDDNNNN_short_description.sql`**, where `NNNN` is a counter within the day (for example `202609220001_hq_mvp.sql`). They run in filename order.
- **Never edit a migration that has been applied** to any shared environment. Write a new migration that changes it.
- **Write migrations that can safely run again:** use `create table if not exists`, `create or replace function`, and `drop trigger if exists` before `create trigger`.
- **Try every migration on a test project first,** then staging if one exists, then production.

### Security pattern

Every HQ table and function follows the pattern already in `202609220001_hq_mvp.sql`. Copy it.

1. **Table setup:**
   - Prefix HQ-owned tables with `hq_`.
   - Always include an `organization_id` column.
   - Add `check` constraints on text length and enum-like values.
2. **Turn on RLS:** `alter table ... enable row level security;`
3. **Remove default access, then grant only what is needed:**
   - `revoke all ... from anon, authenticated;`
   - Grant only the operations the browser needs, for example `select, insert`.
4. **Write explicit policies** for each allowed operation. Use the shared helpers `can_read_hq_department`, `can_write_hq_department`, and `can_manage_hq_department`.
5. **Put multi-step rules in a `security definer` function.** A status change with a revision check is one example.
   - Declare it with `set search_path = ''` and schema-qualified names (`public.x`).
   - Check the caller's permission inside the function.
   - Revoke it from `public` and `anon`, and grant `execute` to `authenticated`.
6. **Never trust the client for server-owned fields.** Either a trigger sets the field, as `hq_updates.author_name` is set from the caller's profile, or a policy enforces it, as in `created_by = (select auth.uid())` or `status = 'open'` on insert.
7. **Department codes** in `check` constraints must match `frontend/src/shared/config/departments.ts`.

### Shared tables

Tables that come from the inventory app belong to both apps. Change them only together with `../inventory-app`, and never drop or rename a column the other app reads.

### Applying migrations

The Supabase CLI isn't set up in this repo yet. For now, run the SQL through the Supabase dashboard's SQL editor, on the test project first. When the CLI is adopted, run `supabase init` in `backend/`. `migrations/` already sits in the layout the CLI expects.

## API (`api/`)

This is where anything that needs a secret, a third-party integration (Google Calendar, email, POS), scheduled jobs, or heavy calculations such as the inventory maths moving out of Streamlit will go.

The API is organised the same way as the frontend: **one package per product feature.** Each feature holds its own HTTP routes, rules, and data access, so it can be worked on, and later split out if it ever needs to be, without touching the others.

```
api/
├── app/
│   ├── main.py              create_app(): CORS, docs switch, registers each feature's router
│   ├── core/                cross-cutting, no product knowledge
│   │   ├── config.py        Settings from HQ_* environment variables
│   │   └── health.py        GET /health for the host's liveness check
│   └── features/            one package per product area (empty until the first feature)
├── tests/
│   ├── test_app.py          app-wide behaviour: health, docs switch, CORS
│   └── features/<name>/     tests for each feature, mirroring app/features/
├── requirements.txt         runtime dependencies, pinned
└── requirements-dev.txt     adds test dependencies
```

### Inside a feature

```
app/features/<name>/
├── __init__.py
├── routes.py        HTTP only: path, request/response models, status codes; calls the service
├── schemas.py       Pydantic models for requests and responses (the API contract)
├── service.py       business rules; plain Python, knows nothing about HTTP
├── repository.py    database and third-party calls; the only place that touches clients
└── dependencies.py  FastAPI dependencies this feature needs (optional)
```

- **The flow is `routes → service → repository`.** A route never talks to the database, and a service never raises HTTP errors. Services raise the feature's own exceptions, which the route maps to status codes.
- **Features don't import each other's `repository.py`.** If one feature needs another's data, call that feature's service, or move the shared piece into `core/`.
- **Register the router in `app/main.py`** with a prefix named after the feature, for example `/inventory`.
- **Tests go in `tests/features/<name>/`.** Test the service with a fake repository passed in, and test routes with `TestClient`.

### Growing `core/`

Add these to `core/` when the first real feature needs them, not before:

| When | Add |
| --- | --- |
| First endpoint that isn't public | `core/auth.py`: a dependency that verifies the Supabase access token and returns the current user |
| First database access from the API | `core/database.py`: one Supabase or Postgres client, created from settings |
| Errors need a consistent shape | `core/errors.py`: exception handlers that return `{ "error": { "code", "message" } }` |
| Anything runs on a schedule | a `worker` entry point that reuses the same feature services |

### API security

These rules apply before the first real endpoint ships:

- **Verify the caller.** Every endpoint except `/health` must check the caller's Supabase access token (the `Authorization: Bearer` header) against the project's JWT signing keys, through `core/auth.py`. Take the user ID from the verified token.
- **Don't trust the request body for permissions.** Never accept a user ID or role from the body as proof of anything. Re-check organization and department membership on the server.
- **Keep privileged credentials in the environment.** The Supabase service-role key and third-party secrets come only from environment variables on the host. Add every new variable to `.env.example` as a placeholder, and to `infra/README.md`.
- **CORS** only allows the HQ frontend's origins (`HQ_CORS_ORIGINS`). Interactive docs are off when `HQ_ENVIRONMENT=production`.

### Checks

Run from `backend/api/`. On Windows, use `.venv/Scripts/`. On macOS or Linux, use `.venv/bin/`.

```bash
python -m venv .venv
```

```bash
.venv/Scripts/pip install -r requirements-dev.txt
```

```bash
.venv/Scripts/python -m pytest -W error
```

```bash
.venv/Scripts/uvicorn app.main:app --reload
```

Tests run with warnings treated as errors, so deprecations surface early. When you upgrade dependencies, update the pins in both requirements files and rerun the tests.
