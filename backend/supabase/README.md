# Supabase contract audit

HQ uses the inventory app's Supabase Auth, organizations, active store access, and department memberships. The inventory app owns those shared tables and its existing report, ticket, ordering, and workspace records. HQ owns `hq_tasks`, `hq_updates`, and future `hq_` tables. Change an inventory-owned contract in the inventory repository first, with a coordinated HQ follow-up; do not duplicate its data in HQ tables.

See [ACCESS_MODEL.md](ACCESS_MODEL.md) for the three access layers and the weekly/monthly Team Reports handoff contract.

## Environment gate

The local HQ frontend and inventory app currently point to the same Supabase project. On 2026-09-25, its dashboard identified the project branch as **main PRODUCTION**. The organization's project picker listed no separate test project. Do not run migration, fixture, or write-based RLS tests there. The inventory app's local `APP_ENV=development` does not make the connected database a test environment.

The production project's read-only catalog showed 38 names in `app_schema_migrations` against 42 local inventory SQL files. Five local files were unrecorded (`202609180007`, `202609200001`, `202609200002`, `202609210001`, and `202609210002`); the ledger contained an older `202609090015_allow_covering_toast_import.sql` name absent from the checkout. `hq_tasks` and `hq_updates` were absent. This is a snapshot, not permission to apply missing migrations to production. Reconcile names and deployment history before touching that project.

The product will use one hosted Supabase project. Use an isolated **local Supabase stack** with synthetic data for migration and RLS tests before deploying to that hosted project. A separate hosted test project is optional, not assumed. If one is later available, the guarded read-only catalog audit requires `HQ_TEST_DATABASE_URL`, `HQ_TEST_PROJECT_REF`, and `HQ_PRODUCTION_PROJECT_REF` from local secure environment settings. It refuses an unidentifiable or production-matching database URL and never prints credentials:

```powershell
python -m pip install "psycopg[binary]>=3.2,<4"
python backend/supabase/checks/audit_database.py --inventory-migrations ../inventory-app/supabase/migrations
```

The audit reads migration names, table RLS flags, HQ policies, grants, and security-definer function settings inside a read-only transaction. The `supabase-contracts` CI workflow runs offline contract checks; it does **not** apply migrations or prove row-level behavior.

## Isolated local database

Docker Desktop and a local Supabase stack were verified on 2026-09-25. The disposable CLI project is at `../summerfield-hq-local-supabase`, outside both Git repositories and not linked to the hosted project. To rebuild it on another machine, initialize a separate directory with `npx --yes supabase@2.118.0 init`, then from this HQ repository run:

```powershell
python backend/supabase/checks/prepare_local.py --inventory-migrations ../inventory-app/supabase/migrations --project ../summerfield-hq-local-supabase
```

From the local project directory, run `npx --yes supabase@2.118.0 start`, then `npx --yes supabase@2.118.0 test db`. `npx --yes supabase@2.118.0 db reset --local` replays migrations after local changes; **never use `--linked` for this test workflow**. Re-run the preparer with `--refresh` when source SQL or tests change; without that explicit flag it refuses to overwrite changed copies. Neither source repository is modified.

The preparer explicitly excludes `202609160003_add_seasonal_drinks.sql`: it seeds real Summerfield product data and aborts on a clean database without the existing organization and vendor. On 2026-09-26, a separate unlinked project at `../summerfield-hq-replay-20260925` replayed all 48 current schema migrations from both repositories in filename order. Its ledger recorded 48 versions, from `202609090001` through `202609260002`, and all four HQ pgTAP files passed (136 assertions). The original QA stack and its synthetic reports were not reset. This validates the clean schema/RLS replay, **not** the excluded production-data seed or the hosted migration ledger. CI still runs only offline checks because the inventory repository is private and its migration checkout is not available to the HQ workflow token; add a read-only cross-repository credential or another reproducible source before requiring pgTAP in CI.

## HQ migration register

Record every new HQ migration here with its prerequisite, isolated-local test, and hosted status. Mark a hosted migration applied only after verifying it against the hosted ledger. This register is a deployment checklist, not approval to apply SQL to production.

| Migration | Prerequisite and local verification | Hosted status |
| --- | --- | --- |
| `202609220001_hq_mvp.sql` | Inventory schema; applied in isolated local stack and covered by HQ pgTAP tests | Pending reconciliation; HQ tables absent in last read-only snapshot |
| `202609250003_require_task_write_access_for_status.sql` | HQ MVP migration; SQL applied in isolated local stack under its former `202609250001` filename and covered by task-status pgTAP tests | Pending reconciliation; not deployed by this work |
| `202609260002_hq_projects.sql` | HQ MVP access helpers and inventory `202609260001`; clean 48-migration replay and project pgTAP passed | Pending reconciliation; not deployed by this work |

HQ owns `hq_projects`. The table stores a department-scoped project with optional Asana link, owner, dates, status, revision, and reversible archive state. Authenticated clients can read under department RLS but cannot write directly. Member/lead/admin creation and owner/creator/lead/admin edits use revision-checked RPCs; only a department lead or admin archives/restores. Active project owners must be department members or leads with write access (or organization admins); department viewers cannot be owners. The owner picker uses `list_hq_project_owners` with the same eligibility rule. Project tasks, files, chat, and member rosters are not connected yet. The existing local QA stack received the new project SQL directly for browser smoke testing without a reset; its historical migration ledger was **not** repaired or used as clean replay evidence. Do not treat that local ledger as a deployment model.

The Team Report history library originally added no migration. Its organization-wide cursor query now requires inventory-owned `202609250002_team_reports_org_updated_cursor.sql`; the SQL was checked in the unlinked local stack, but has not been applied to the hosted project. Local `team_report_history.test.sql` covers its access and multi-period contract.

Report library search also requires inventory-owned `202609250004_team_report_search_dates.sql`. It adds a read-only computed field for the visible weekly/monthly period and updated date, used alongside summary and displayed name matches. The isolated local stack passed `team_report_history.test.sql`; the hosted project has not received the migration. Until it does, HQ falls back to name/summary search and displays a date-search notice. In the shared hosted migration ledger, reconcile and apply the pending HQ `202609250003` migration before inventory `202609250004`; do not promote the frontend expecting full date search before both are verified.

The connected HQ Ticket desk uses inventory-owned `202609210001_tickets.sql` and `202609260001_ticket_assignee_read_access.sql`. Its `create_ticket`, `list_tickets`, `get_ticket`, `update_ticket_status`, `assign_ticket`, and `list_ticket_events` RPCs remain the database permission boundary. HQ also uses `list_hq_department_people` to offer department assignees. The new migration lets an active assignee read the ticket, activity, and photos without granting reviewer write access; removing the assignment removes that read access. `ticket_workflow.test.sql` exercises store-scoped submission, reporter/assignee/lead/admin visibility, reviewer-only status and assignment, revision conflicts, activity, reassignment, and organization isolation against an isolated local database. Both ticket migrations are pending hosted-ledger reconciliation; do not enable this connected workflow on the hosted project until the ledger and related HQ migrations are reviewed and applied in order.

**Version collision resolved in source:** inventory added `202609250001_store_inspection_photo_limits.sql` after the HQ task-status SQL had been tested locally under the same numeric version. HQ's not-yet-hosted file was renamed to `202609250003_require_task_write_access_for_status.sql`, and the local preparer now rejects numeric version overlaps. The existing unlinked QA stack still records the old HQ `202609250001` version; do not reset or repair that stack merely to align the ledger. The separate fresh replay confirmed inventory `202609250001`, inventory `202609250002`, HQ `202609250003`, and inventory `202609250004` in that order. If a hosted ledger unexpectedly records the old HQ version, investigate before applying anything. Hosted migration-ledger drift, backup, and role/RLS validation remain deployment gates.

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
