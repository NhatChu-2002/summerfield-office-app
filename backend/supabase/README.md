# Supabase contract audit

HQ uses the inventory app's Supabase Auth, organizations, active store access, and department memberships. The inventory app owns those shared tables and its existing report, ticket, ordering, and workspace records. HQ owns `hq_tasks`, `hq_updates`, and future `hq_` tables. Change an inventory-owned contract in the inventory repository first, with a coordinated HQ follow-up; do not duplicate its data in HQ tables.

## Environment gate

The local HQ frontend and inventory app currently point to the same Supabase project. On 2026-09-25, its dashboard identified the project branch as **main PRODUCTION**. The organization's project picker listed no separate test project. Do not run migration, fixture, or write-based RLS tests there. The inventory app's local `APP_ENV=development` does not make the connected database a test environment.

The production project's read-only catalog showed 38 names in `app_schema_migrations` against 42 local inventory SQL files. Five local files were unrecorded (`202609180007`, `202609200001`, `202609200002`, `202609210001`, and `202609210002`); the ledger contained an older `202609090015_allow_covering_toast_import.sql` name absent from the checkout. `hq_tasks` and `hq_updates` were absent. This is a snapshot, not permission to apply missing migrations to production. Reconcile names and deployment history before touching that project.

Provision or identify a separate Supabase test project with a distinct project ref and synthetic data. Apply inventory migrations there in order, followed by HQ migrations. Use a single migration ledger for both sets. The read-only audit requires `HQ_TEST_DATABASE_URL`, `HQ_TEST_PROJECT_REF`, and `HQ_PRODUCTION_PROJECT_REF` from local secure environment settings. It refuses an unidentifiable or production-matching database URL and never prints credentials:

```powershell
python -m pip install "psycopg[binary]>=3.2,<4"
python backend/supabase/checks/audit_database.py --inventory-migrations ../inventory-app/supabase/migrations
```

The audit reads migration names, table RLS flags, HQ policies, grants, and security-definer function settings inside a read-only transaction. The `supabase-contracts` CI workflow runs offline contract checks; it does **not** apply migrations or prove row-level behavior. Add a test-project integration job only after the project and CI credentials are provisioned.

## Department codes

The twelve codes in `frontend/src/shared/config/departments.ts` are supported by inventory membership constraints and the initial HQ task/update constraints. `it` and `hr` remain in `previewOnlyDepartments` for the design preview, not authenticated access. Do not alias them to `admin_and_payroll` or another department: that would change who can see records. Adding them as real departments later requires coordinated inventory membership/template changes, a new HQ migration, access tests, and a product decision.

## Test role and store matrix

Seed only synthetic users in two test organizations. Include an admin, department lead, member, and viewer; a manager with store membership, a manager without it; an inactive account; and a user in the other organization. Create two departments and one active store per organization. Then verify:

| Identity | HQ department data | Active stores |
| --- | --- | --- |
| Admin | Read/write across the organization; manage task status | All stores in that organization |
| Lead | Read/write assigned department; manage its task status | Only assigned stores |
| Member | Read/write assigned department; task status only as creator or assignee | Only assigned stores |
| Viewer | Read assigned department; no inserts or status changes | Only assigned stores |
| Manager without department assignment | No department data from organization role alone | Only assigned stores |
| Inactive or other-organization user | No access | No access |

Check `get_my_access_context`, `get_my_team_report_departments`, task/update read and insert, `set_hq_task_status` revision conflicts, and store reads. Repeat after removing a department or store assignment. Record the results before enabling new HQ writes. No sample-role or store-access behavior was run against production during this audit.
