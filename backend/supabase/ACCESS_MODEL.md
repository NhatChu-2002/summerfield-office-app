# Access layers and report handoff

This is the HQ implementation contract for one Supabase Auth account per person. It records the current inventory schema and HQ code; it does not claim that the pending HQ migrations have been applied to the hosted database.

## Three independent layers

| Layer | Source | Meaning |
| --- | --- | --- |
| Organization | `organization_memberships.role`: `admin`, `manager`, `viewer` | `admin` crosses departments and active stores. `manager` can manage assigned stores; it does not automatically enter departments. `viewer` is the baseline organization membership, not a promise that every assigned department is read-only. |
| Department | `team_report_memberships.team_role`: `lead`, `member`, `viewer` per code | Active assignments control department reads, edits, and submission. One person may hold different roles in different departments. |
| Store | `store_memberships` plus active organization/store checks | A non-admin can access only assigned active stores. Store management also requires organization `manager`. |

The source functions are `has_org_role`, `has_team_report_role`, `can_access_store`, and `can_manage_store` in the inventory migrations. HQ uses those helpers in its department functions. The frontend now preserves active stores returned by `get_my_access_context`; that context shapes navigation, but RLS and RPC checks make the final decision. Never add a broad `manager` bypass to department policies or put authorization only in a JWT claim. Revocations should take effect against the membership tables without waiting for a token refresh.

## Audit findings

- HQ's original `set_hq_task_status` allowed a creator or assignee to change status after a department *read* check. That included an assigned department viewer. Migration `202609250003_require_task_write_access_for_status.sql` adds a department *write* check, and the task UI now matches it. The SQL passed isolated local tests but has not been deployed. Its filename was changed from `202609250001` before hosted deployment to avoid a version collision with inventory.
- `validate_hq_task_assignee` still permits assigning a task to an active department viewer. That person can see the task but cannot complete it after the status fix. Decide whether assignment should require `member`/`lead` before enabling connected task creation.
- An organization `manager` without a department assignment does not get HQ department access. A department `lead` who is not an organization `manager` can submit an organization-scoped report but not a store-scoped one.
- IT and HR remain design-preview-only codes, outside shared membership and report constraints.
- The hosted project still has migration-ledger drift and no HQ tables in the last read-only snapshot. Do not apply either HQ migration there until history is reconciled. The local schema/RLS sequence passes with the production-data seasonal seed excluded.

## Weekly and monthly Team Reports

The connected HQ report pages target `team_reports`, not `department_workspace_submissions`. The inventory backend already exposes `list_team_report_summaries`, `get_team_report_for_period`, `save_team_report_draft`, `submit_team_report`, and admin-only `reopen_team_report`. Preserve their revision checks and errors. The history library reads only report metadata directly from `team_reports` under its SELECT RLS policy, with server-side filters and a `(updated_at, id)` cursor; it does not depend on the summaries RPC's 100-row limit. The current-period board also makes one metadata-only, period-filtered table read under RLS. Opening a report still uses `get_team_report_for_period` for its full payload. A cursor prevents offset shifts when newer rows are inserted, but an older unseen row edited during paging can move ahead of the cursor; refresh the view to see a new ordering.

A report is identified by organization, department, report type (`weekly` or `monthly` in this first UI), period start/end, and optional store. One row evolves within that identity; history is across periods. `store_manager` reports require a store; other departments are organization-scoped. The current HQ preview's `department-month` ID and flat `values` object are **not** the persisted contract. The inventory report payload is versioned JSON, with weekly/monthly templates and separate submission snapshots. Port the template definition deliberately into the HQ report feature; do not import runtime code across repositories or silently reinterpret old payload versions.

| Person | Organization-scoped report | Store Manager report for an assigned active store |
| --- | --- | --- |
| Organization admin | Read, edit, submit, reopen | Read, edit, submit, reopen |
| Department lead, org viewer | Read, edit, submit | Read, edit; cannot submit without store-management authority |
| Department lead, org manager | Read, edit, submit | Read, edit, submit |
| Department member | Read, edit draft | Read, edit draft when store-assigned |
| Department viewer | Read only | Read only when store-assigned |
| Org manager with no department assignment | No department report access | No department report access |

The `reportCapabilities` helper mirrors these rules for future controls. The RPCs remain authoritative, and the server can reject stale revisions or changed memberships. The connected index should offer weekly/monthly views, only accessible departments and stores, clear draft/submitted states, and read-only presentation for viewers. No placeholder button should imply that a company report was saved.

## Verification gate

The isolated local replay passed 168 pgTAP assertions across access layers, report history, tickets, and projects on 2026-09-26. The full versioned report template payload still needs coverage, and pgTAP must run in CI before hosted deployment. The hosted project is not a fixture environment; this audit made no data changes there.

## Ticket routing

Ticket permissions are deliberately different from the general department/store layers above. Inventory `202609260003_ticket_lead_routing.sql` allows any active department lead or organization admin to see all tickets in their organization and move a wrong-department ticket to another supported department. A reroute clears the prior assignee, increments the revision, and records activity. A department lead can submit for any active organization store, including a request to a different team. They can assign a teammate during submission only for a department they lead. Reviewer status and assignment edits remain restricted to the ticket's current department lead or organization admin. Store managers can submit only for their assigned active stores and see tickets they reported or were assigned; ordinary members are not newly granted submission. All reads and writes are checked by database functions against current memberships, not only by the frontend.

## Shared Projects

HQ-owned `hq_projects` uses the same supported department codes and access helpers as HQ tasks. Any active assigned viewer can read that department's projects. A member, lead, or organization admin can create. Only active department members/leads and organization admins can own a project; the owner-picker RPC uses the same rule. A project creator or active owner may edit only while they retain department write access; a lead or admin can edit any project in their scope. Only a lead or admin can archive and restore. Store-management role alone is not department access. Clients cannot insert, update, or delete project rows directly; create, edit, and archive RPCs check current memberships and revisions. Archiving is reversible, and archived records remain readable. Department reassignment, project-task membership, file storage, chat, and Asana synchronization are not part of this first connected contract.
