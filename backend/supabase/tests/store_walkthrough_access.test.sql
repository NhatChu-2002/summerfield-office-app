begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('44444444-4444-4444-4444-444444444441', 'walk-operations@example.test', '{"display_name":"Operations lead"}'),
  ('44444444-4444-4444-4444-444444444442', 'walk-stores@example.test', '{"display_name":"Stores lead"}'),
  ('44444444-4444-4444-4444-444444444443', 'walk-marketing@example.test', '{"display_name":"Marketing lead"}'),
  ('44444444-4444-4444-4444-444444444444', 'walk-manager@example.test', '{"display_name":"Store manager"}'),
  ('44444444-4444-4444-4444-444444444445', 'walk-viewer@example.test', '{"display_name":"Store viewer"}'),
  ('44444444-4444-4444-4444-444444444446', 'walk-other@example.test', '{"display_name":"Other admin"}'),
  ('44444444-4444-4444-4444-444444444447', 'walk-admin@example.test', '{"display_name":"Walk admin"}');

insert into public.organizations (id, slug, name) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'walk-one', 'Walk One'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'walk-two', 'Walk Two');

insert into public.organization_memberships (organization_id, user_id, role) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '44444444-4444-4444-4444-444444444441', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '44444444-4444-4444-4444-444444444442', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '44444444-4444-4444-4444-444444444443', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '44444444-4444-4444-4444-444444444444', 'manager'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '44444444-4444-4444-4444-444444444445', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', '44444444-4444-4444-4444-444444444446', 'admin'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '44444444-4444-4444-4444-444444444447', 'admin');

insert into public.team_report_memberships (organization_id, department_code, user_id, team_role) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'operations', '44444444-4444-4444-4444-444444444441', 'lead'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'store_manager', '44444444-4444-4444-4444-444444444442', 'lead'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'marketing', '44444444-4444-4444-4444-444444444443', 'lead');

insert into public.stores (id, organization_id, code, name, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'one', 'Store One', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'two', 'Store Two', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'closed', 'Inactive Store', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', 'other', 'Other Store', true);

insert into public.store_memberships (store_id, user_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '44444444-4444-4444-4444-444444444445');

set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444441', true);
select extensions.ok(public.can_edit_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'), 'Operations lead can edit active store');
select extensions.ok(public.can_edit_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'Operations lead can edit another active organization store');
select extensions.ok(not public.can_read_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'), 'inactive store remains unavailable');
select extensions.is((select count(*) from public.list_store_inspection_stores('dddddddd-dddd-dddd-dddd-ddddddddddd1')), 2::bigint, 'lead picker lists active organization stores');
select extensions.is((select count(*) from public.list_store_inspection_stores('dddddddd-dddd-dddd-dddd-ddddddddddd1') where can_edit), 2::bigint, 'lead can edit each listed store');
select extensions.is((public.save_store_inspection_draft(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  '2026-09-26', 1, '{"visit":{"meta":{"mgrName":"Alex","queue":"2"}}}', 0
)->>'revision')::integer, 1, 'lead saves a version-one draft using the existing payload shape');
select extensions.is((public.get_store_inspection_for_date(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '2026-09-26'
)->'payload'->'visit'->'meta'->>'mgrName'), 'Alex', 'draft round-trips the legacy meta fields');
select extensions.is((public.save_store_inspection_draft(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  '2026-09-26', 1, '{"visit":{"meta":{"mgrName":"Alex","queue":"3","unknown":"keep"}}}', 1
)->>'revision')::integer, 2, 'lead updates the draft with a checked revision');
select extensions.throws_ok(
  $$select public.save_store_inspection_draft('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '2026-09-26', 1, '{}', 1)$$,
  'P0001', 'This inspection changed after it was loaded; reload before saving', 'stale revision cannot replace a newer draft'
);
select extensions.is((public.save_store_inspection_draft(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '2026-09-25', 1, '{"visit":{"meta":{"mgrName":"Bea"}}}', 0
)->>'revision')::integer, 1, 'lead can create a second store visit');
select extensions.is((select count(*) from public.list_store_inspection_page('dddddddd-dddd-dddd-dddd-ddddddddddd1', p_limit => 1)), 1::bigint, 'inspection history returns a bounded page');
select extensions.is((select visit_date from public.list_store_inspection_page(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  p_cursor_visit_date => '2026-09-26',
  p_cursor_updated_at => (select updated_at from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  p_cursor_id => (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  p_limit => 1
)), '2026-09-25'::date, 'history cursor reaches the older visit');
select extensions.is((select count(*) from public.list_store_inspection_page('dddddddd-dddd-dddd-dddd-ddddddddddd1', p_store_id => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')), 1::bigint, 'history filters by store');
select extensions.throws_ok(
  $$select * from public.list_store_inspection_page('dddddddd-dddd-dddd-dddd-ddddddddddd1', p_cursor_visit_date => '2026-09-26')$$,
  'P0001', 'Complete inspection cursor is required', 'partial history cursor is rejected'
);
select extensions.is((public.register_store_inspection_photo(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  'safe:0',
  'dddddddd-dddd-dddd-dddd-ddddddddddd1/' || (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2')::text || '/safe-0/' || repeat('a', 64) || '.jpg',
  repeat('a', 64), 'image/jpeg', 1200
)->>'question_key'), 'safe:0', 'lead can register draft photo evidence');
select extensions.is((select count(*) from public.list_store_inspection_photos(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'safe:0'
)), 1::bigint, 'lead can read photo metadata');
select extensions.is((public.submit_store_inspection(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 2
)->>'status'), 'submitted', 'lead can submit a checked draft');
select extensions.is((select count(*) from public.store_inspection_snapshots where inspection_id =
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2')
), 1::bigint, 'submission creates an immutable snapshot');
select extensions.throws_ok(
  $$select public.save_store_inspection_draft('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '2026-09-26', 1, '{}', 3)$$,
  'P0001', 'Submitted inspections are read-only', 'submitted visit cannot be edited'
);
select extensions.throws_ok(
  $$select public.register_store_inspection_photo('dddddddd-dddd-dddd-dddd-ddddddddddd1', (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'safe:1', 'test/path', repeat('b', 64), 'image/jpeg', 100)$$,
  'P0001', 'Submitted inspections are read-only', 'submitted visit cannot gain photos'
);
select extensions.throws_ok(
  $$select public.reopen_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 3)$$,
  'P0001', 'Administrator access is required', 'department lead cannot reopen a submitted visit'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444442', true);
select extensions.ok(public.can_edit_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'Stores department lead can edit an active store');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444443', true);
select extensions.ok(not public.can_read_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'unassigned Marketing lead cannot read a store inspection');
select extensions.ok(not public.can_edit_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'other department lead cannot edit');
select extensions.is((select count(*) from public.list_store_inspection_stores('dddddddd-dddd-dddd-dddd-ddddddddddd1')), 0::bigint, 'other lead has no store picker entries');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select extensions.is((select count(*) from public.list_store_inspection_stores('dddddddd-dddd-dddd-dddd-ddddddddddd1')), 1::bigint, 'manager picker remains assigned-store only');
select extensions.is((select count(*) from public.list_store_inspection_page('dddddddd-dddd-dddd-dddd-ddddddddddd1')), 1::bigint, 'manager history shows only assigned store');
select extensions.ok(public.can_edit_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'), 'manager retains assigned-store edit');
select extensions.ok(not public.can_edit_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'manager cannot edit an unassigned store');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444445', true);
select extensions.ok(public.can_read_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'), 'assigned viewer retains read access');
select extensions.ok(not public.can_edit_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'), 'assigned viewer cannot edit');
select extensions.is((select count(*) from public.list_store_inspection_stores('dddddddd-dddd-dddd-dddd-ddddddddddd1') where can_edit), 0::bigint, 'viewer picker marks store read-only');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444446', true);
select extensions.throws_ok(
  $$select * from public.list_store_inspection_stores('dddddddd-dddd-dddd-dddd-ddddddddddd1')$$,
  'P0001', 'Organization access is required', 'other-organization account cannot list stores'
);
select extensions.throws_ok(
  $$select * from public.list_store_inspection_page('dddddddd-dddd-dddd-dddd-ddddddddddd1')$$,
  'P0001', 'Organization access is required', 'other-organization account cannot page history'
);
select extensions.ok(not public.can_read_store_inspection('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 'other-organization account cannot read draft');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444447', true);
select extensions.is((public.reopen_store_inspection(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 3
)->>'status'), 'draft', 'organization admin can reopen a submitted visit');
select extensions.is((select count(*) from public.store_inspection_snapshots where inspection_id =
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2')
), 1::bigint, 'reopen preserves the submitted snapshot');
select extensions.is((public.submit_store_inspection(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'), 4
)->>'status'), 'submitted', 'admin can resubmit a reopened visit');
select extensions.is((select count(*) from public.store_inspection_snapshots where inspection_id =
  (select id from public.store_inspections where store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2')
), 2::bigint, 'resubmission adds a second immutable snapshot');

select extensions.ok(not has_function_privilege('anon', 'public.list_store_inspection_stores(uuid)', 'EXECUTE'), 'anonymous users cannot list inspection stores');
select * from extensions.finish();
rollback;
