begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('22222222-2222-2222-2222-222222222221', 'history-viewer@example.test', '{"display_name":"History viewer"}'),
  ('22222222-2222-2222-2222-222222222222', 'history-outsider@example.test', '{"display_name":"History outsider"}'),
  ('22222222-2222-2222-2222-222222222223', 'history-admin@example.test', '{"display_name":"History admin"}');

insert into public.organizations (id, slug, name) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'history-one', 'History One'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'history-two', 'History Two');

insert into public.organization_memberships (organization_id, user_id, role) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '22222222-2222-2222-2222-222222222221', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '22222222-2222-2222-2222-222222222222', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '22222222-2222-2222-2222-222222222223', 'admin');

insert into public.team_report_memberships (organization_id, department_code, user_id, team_role) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'marketing', '22222222-2222-2222-2222-222222222221', 'viewer');

insert into public.team_reports (organization_id, department_code, report_type, period_start, period_end, template_version, status, summary) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'marketing', 'monthly', '2026-07-01', '2026-07-31', 1, 'submitted', 'July'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'marketing', 'monthly', '2026-08-01', '2026-08-31', 1, 'draft', 'August'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'marketing', 'weekly', '2026-09-21', '2026-09-27', 1, 'draft', 'September week'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'finance', 'monthly', '2026-08-01', '2026-08-31', 1, 'submitted', 'Finance'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'marketing', 'monthly', '2026-08-01', '2026-08-31', 1, 'submitted', 'Other organization');

set local role authenticated;

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222221', true);
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'), 3::bigint, 'assigned viewer sees three historical periods, not finance');
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1' and status = 'draft'), 2::bigint, 'draft filter keeps both weekly and monthly work');
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1' and status = 'submitted'), 1::bigint, 'submitted filter sees prior month');
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd2'), 0::bigint, 'other organization reports stay hidden');
select extensions.is((select summary from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1' and department_code = 'marketing' order by period_end desc limit 1 offset 1), 'August', 'second page retains another period');
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1' and report_type = 'monthly' and period_start = '2026-08-01' and period_end = '2026-08-31'), 1::bigint, 'period metadata query returns only the assigned August card');
select extensions.is((select count(*) from public.team_reports report where report.organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1' and public.team_report_search_dates(report) ilike '%August 2026%'), 1::bigint, 'visible monthly period is searchable without exposing another department');
select extensions.is((select count(*) from public.team_reports report where report.organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1' and public.team_report_search_dates(report) ilike '%Sep 21 - Sep 27, 2026%'), 1::bigint, 'visible weekly period is searchable');
select extensions.is((with first_page as (
  select updated_at, id from public.team_reports
  where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'
  order by updated_at desc, id desc limit 1
) select count(*) from public.team_reports report cross join first_page cursor
  where report.organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'
    and (report.updated_at, report.id) < (cursor.updated_at, cursor.id)), 2::bigint, 'cursor boundary retains both older visible reports');
select extensions.ok(to_regclass('public.team_reports_org_updated_cursor_idx') is not null, 'organization-wide cursor index exists');
select extensions.ok(not has_function_privilege('anon', 'public.team_report_search_dates(public.team_reports)', 'EXECUTE'), 'anonymous users cannot call report date search');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'), 0::bigint, 'organization role without department assignment cannot see reports');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222223', true);
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'), 4::bigint, 'organization admin sees all four in own organization');
select extensions.is((select count(*) from public.team_reports where organization_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd2'), 0::bigint, 'admin still cannot see another organization');

select * from extensions.finish();
rollback;
