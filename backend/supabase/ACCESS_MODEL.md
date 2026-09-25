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

- HQ's original `set_hq_task_status` allowed a creator or assignee to change status after a department *read* check. That included an assigned department viewer. Migration `202609250001_require_task_write_access_for_status.sql` adds a department *write* check, and the task UI now matches it. The migration passed isolated local tests but has not been deployed.
- `validate_hq_task_assignee` still permits assigning a task to an active department viewer. That person can see the task but cannot complete it after the status fix. Decide whether assignment should require `member`/`lead` before enabling connected task creation.
- An organization `manager` without a department assignment does not get HQ department access. A department `lead` who is not an organization `manager` can submit an organization-scoped report but not a store-scoped one.
- IT and HR remain design-preview-only codes, outside shared membership and report constraints.
- The hosted project still has migration-ledger drift and no HQ tables in the last read-only snapshot. Do not apply either HQ migration there until history is reconciled. The local schema/RLS sequence passes with the production-data seasonal seed excluded.

## Weekly and monthly Team Reports

The first connected HQ report page targets `team_reports`, not `department_workspace_submissions`. The inventory backend already exposes `list_team_report_summaries`, `get_team_report_for_period`, `save_team_report_draft`, `submit_team_report`, and admin-only `reopen_team_report`. Preserve their revision checks and errors. Read summaries for the index; fetch the payload only when a report is opened.

A report is identified by organization, department, report type (`weekly` or `monthly` in this first UI), period start/end, and optional store. `store_manager` reports require a store; other departments are organization-scoped. The current HQ preview's `department-month` ID and flat `values` object are **not** the persisted contract. The inventory report payload is versioned JSON, with weekly/monthly templates and separate submission snapshots. Port the template definition deliberately into the HQ report feature; do not import runtime code across repositories or silently reinterpret old payload versions.

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

The local pgTAP suite passes 42 checks with synthetic admins, leads, members, viewers, store managers, inactive accounts, and another organization. It covers helper permissions, store boundaries, cross-organization RLS, member/viewer task status, draft creation, viewer write denial, lead submission, admin reopen, store-report submission, stale revisions, and immediate department/store/organization membership revocation. The full versioned template payload still needs coverage before enabling the connected report page, and pgTAP must run in CI. The hosted project is not a fixture environment; this audit made no data changes there.
