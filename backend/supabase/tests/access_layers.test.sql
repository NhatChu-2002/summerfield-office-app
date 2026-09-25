begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'admin@example.test', '{"display_name":"Test admin"}'),
  ('11111111-1111-1111-1111-111111111112', 'lead@example.test', '{"display_name":"Test lead"}'),
  ('11111111-1111-1111-1111-111111111113', 'member@example.test', '{"display_name":"Test member"}'),
  ('11111111-1111-1111-1111-111111111114', 'viewer@example.test', '{"display_name":"Test viewer"}'),
  ('11111111-1111-1111-1111-111111111115', 'manager@example.test', '{"display_name":"Test manager"}'),
  ('11111111-1111-1111-1111-111111111116', 'storelead@example.test', '{"display_name":"Test store lead"}'),
  ('11111111-1111-1111-1111-111111111117', 'other@example.test', '{"display_name":"Other admin"}'),
  ('11111111-1111-1111-1111-111111111118', 'inactive@example.test', '{"display_name":"Inactive lead"}'),
  ('11111111-1111-1111-1111-111111111119', 'storeviewerlead@example.test', '{"display_name":"Test store-only lead"}');

insert into public.organizations (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'test-one', 'Test One'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'test-two', 'Test Two');

insert into public.organization_memberships (organization_id, user_id, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111112', 'viewer'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111113', 'viewer'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111114', 'viewer'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111115', 'manager'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111116', 'manager'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111117', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111118', 'viewer'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111119', 'viewer');

update public.user_profiles set is_active = false where id = '11111111-1111-1111-1111-111111111118';

insert into public.stores (id, organization_id, code, name) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'one', 'Store One'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'two', 'Store Two'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'three', 'Store Three');

insert into public.store_memberships (store_id, user_id) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111115'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111116'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111119');

insert into public.team_report_memberships (organization_id, department_code, user_id, team_role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', '11111111-1111-1111-1111-111111111112', 'lead'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', '11111111-1111-1111-1111-111111111113', 'member'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', '11111111-1111-1111-1111-111111111114', 'viewer'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'store_manager', '11111111-1111-1111-1111-111111111116', 'lead'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', '11111111-1111-1111-1111-111111111118', 'lead'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'store_manager', '11111111-1111-1111-1111-111111111119', 'lead');

insert into public.hq_tasks (id, organization_id, department_code, title, created_by, assigned_to) values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', 'Check access',
    '11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111114');

set local role authenticated;

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select extensions.ok(public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'admin reads departments');
select extensions.ok(public.can_manage_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'admin manages departments');
select extensions.ok(public.can_access_store('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'), 'admin accesses every active store');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111115', true);
select extensions.ok(public.can_manage_store('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'), 'manager manages assigned store');
select extensions.ok(not public.can_access_store('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'), 'manager cannot access unassigned store');
select extensions.ok(not public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'manager has no implicit department access');
select extensions.ok(not public.can_read_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', null), 'manager has no implicit report access');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111112', true);
select extensions.ok(public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'lead reads assigned department');
select extensions.ok(public.can_manage_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'lead manages assigned department');
select extensions.ok(public.can_submit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', null), 'lead submits organization report');
select extensions.ok(not public.can_read_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'finance', null), 'lead cannot read another department');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111113', true);
select extensions.ok(public.can_write_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'member writes assigned department');
select extensions.ok(not public.can_submit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', null), 'member cannot submit report');
select extensions.is((public.set_hq_task_status('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 1, 'done')->>'status'), 'done', 'creator member completes task');
select extensions.is((public.save_team_report_draft(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', 'monthly', date '2026-09-01', date '2026-09-30',
  null, 1, '{"executive_summary":{"win":"Synthetic test"}}'::jsonb, 0, 'Synthetic report'
)->>'revision')::integer, 1, 'member creates a monthly draft');
select extensions.throws_ok(
  $$select public.save_team_report_draft('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', 'monthly', date '2026-09-01', date '2026-09-30', null, 1, '{}'::jsonb, 0, 'Stale')$$,
  'P0001', 'This draft changed after it was loaded; reload before saving', 'stale draft revision is rejected'
);

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111114', true);
select extensions.ok(public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'viewer reads assigned department');
select extensions.ok(not public.can_write_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'viewer cannot write department');
select extensions.ok(not public.can_edit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', null), 'viewer cannot edit report');
select extensions.is((public.get_team_report_for_period('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', 'monthly', date '2026-09-01', date '2026-09-30', null)->>'status'), 'draft', 'viewer can open an assigned draft');
select extensions.is((select count(*) from public.list_team_report_summaries('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')), 1::bigint, 'viewer sees assigned report summary');
select extensions.throws_ok(
  $$select public.save_team_report_draft('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing', 'monthly', date '2026-09-01', date '2026-09-30', null, 1, '{}'::jsonb, 1, 'Viewer edit')$$,
  'P0001', 'Department edit access is required', 'viewer cannot save an assigned draft'
);
select extensions.throws_ok(
  $$select public.submit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select id from public.team_reports where department_code = 'marketing' and period_start = date '2026-09-01'), 1)$$,
  'P0001', 'Department lead access is required', 'viewer cannot submit an assigned draft'
);
select extensions.throws_ok(
  $$select public.set_hq_task_status('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 2, 'open')$$,
  'P0001', 'Task update access is required', 'assigned viewer cannot change task status'
);

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111112', true);
select extensions.throws_ok(
  $$select public.submit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select id from public.team_reports where department_code = 'marketing' and period_start = date '2026-09-01'), 0)$$,
  'P0001', 'This draft changed after it was loaded; reload before submitting', 'stale submission revision is rejected'
);
select extensions.is((public.submit_team_report(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  (select id from public.team_reports where department_code = 'marketing' and period_start = date '2026-09-01'), 1
)->>'status'), 'submitted', 'department lead submits monthly report');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select extensions.throws_ok(
  $$select public.reopen_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select id from public.team_reports where department_code = 'marketing' and period_start = date '2026-09-01'), 1)$$,
  'P0001', 'This report changed after it was loaded; reload before reopening', 'stale reopen revision is rejected'
);
select extensions.is((public.reopen_team_report(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  (select id from public.team_reports where department_code = 'marketing' and period_start = date '2026-09-01'), 2
)->>'status'), 'draft', 'admin reopens submitted report');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111116', true);
select extensions.ok(public.can_submit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'store_manager', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'), 'store manager with department lead submits assigned store report');
select extensions.ok(not public.can_read_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'store_manager', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'), 'store lead cannot read unassigned store report');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111119', true);
select extensions.ok(public.can_edit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'store_manager', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'), 'department lead can edit assigned store report');
select extensions.ok(not public.can_submit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'store_manager', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'), 'department lead without manager role cannot submit store report');
select extensions.is((public.save_team_report_draft(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'store_manager', 'weekly', date '2026-09-21', date '2026-09-27',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 1, '{}'::jsonb, 0, 'Synthetic store report'
)->>'revision')::integer, 1, 'department lead creates assigned store draft');
select extensions.throws_ok(
  $$select public.submit_team_report('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', (select id from public.team_reports where department_code = 'store_manager' and period_start = date '2026-09-21'), 1)$$,
  'P0001', 'Department lead access is required', 'department lead without manager role cannot submit store draft'
);

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111116', true);
select extensions.is((public.submit_team_report(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  (select id from public.team_reports where department_code = 'store_manager' and period_start = date '2026-09-21'), 1
)->>'status'), 'submitted', 'store manager with department lead submits store draft');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111117', true);
select extensions.ok(not public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'other organization admin cannot read first organization');
select extensions.is((select count(*) from public.hq_tasks), 0::bigint, 'RLS hides other organization tasks');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111118', true);
select extensions.ok(not public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'inactive profile cannot read department');
select extensions.ok(not public.can_access_store('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'), 'inactive profile cannot access store');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
update public.team_report_memberships set is_active = false
where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
  and department_code = 'marketing' and user_id = '11111111-1111-1111-1111-111111111112';
delete from public.store_memberships
where store_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1' and user_id = '11111111-1111-1111-1111-111111111116';
update public.organization_memberships set is_active = false
where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1' and user_id = '11111111-1111-1111-1111-111111111114';

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111112', true);
select extensions.ok(not public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'removed department assignment immediately revokes access');
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111116', true);
select extensions.ok(not public.can_access_store('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'), 'removed store assignment immediately revokes access');
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111114', true);
select extensions.ok(not public.can_read_hq_department('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'marketing'), 'inactive organization membership revokes department access');

select * from extensions.finish();
rollback;
