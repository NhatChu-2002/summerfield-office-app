begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('44444444-4444-4444-4444-444444444441', 'project-admin@example.test', '{"display_name":"Project admin"}'),
  ('44444444-4444-4444-4444-444444444442', 'project-lead@example.test', '{"display_name":"Project lead"}'),
  ('44444444-4444-4444-4444-444444444443', 'project-member@example.test', '{"display_name":"Project member"}'),
  ('44444444-4444-4444-4444-444444444444', 'project-owner@example.test', '{"display_name":"Project owner"}'),
  ('44444444-4444-4444-4444-444444444445', 'project-viewer@example.test', '{"display_name":"Project viewer"}'),
  ('44444444-4444-4444-4444-444444444446', 'project-finance@example.test', '{"display_name":"Finance member"}'),
  ('44444444-4444-4444-4444-444444444447', 'project-manager@example.test', '{"display_name":"Store manager"}'),
  ('44444444-4444-4444-4444-444444444448', 'project-inactive@example.test', '{"display_name":"Inactive owner"}'),
  ('44444444-4444-4444-4444-444444444449', 'project-other@example.test', '{"display_name":"Other admin"}');

insert into public.organizations (id, slug, name) values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'project-one', 'Project One'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'project-two', 'Project Two');

insert into public.organization_memberships (organization_id, user_id, role, is_active) values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444441', 'admin', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444442', 'viewer', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444443', 'viewer', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444444', 'viewer', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444445', 'viewer', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444446', 'viewer', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444447', 'manager', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '44444444-4444-4444-4444-444444444448', 'viewer', false),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '44444444-4444-4444-4444-444444444449', 'admin', true);

insert into public.team_report_memberships (organization_id, department_code, user_id, team_role) values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', '44444444-4444-4444-4444-444444444442', 'lead'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', '44444444-4444-4444-4444-444444444443', 'member'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', '44444444-4444-4444-4444-444444444444', 'member'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', '44444444-4444-4444-4444-444444444445', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'finance', '44444444-4444-4444-4444-444444444446', 'member');

insert into public.hq_projects (
  id, organization_id, department_code, name, owner_id, created_by, updated_by
) values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
  'dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Launch plan',
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444442',
  '44444444-4444-4444-4444-444444444442'
);

set local role authenticated;

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444445', true);
select extensions.is((select count(*) from public.hq_projects), 1::bigint, 'viewer reads an assigned department project');
select extensions.ok(not public.can_edit_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444'), 'viewer cannot edit project');
select extensions.is((select count(*) from public.list_hq_project_owners('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing')), 4::bigint, 'owner picker includes only admin, lead, and members');
select extensions.is((select count(*) from public.list_hq_project_owners('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing') where user_id = '44444444-4444-4444-4444-444444444445'), 0::bigint, 'owner picker excludes department viewer');
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Viewer project')$$,
  'P0001', 'Project create access is required', 'viewer cannot create project'
);
select extensions.throws_ok(
  $$select public.update_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 1, 'Changed', '', 'track', null, null, null, null)$$,
  'P0001', 'Project edit access is required', 'viewer cannot edit via RPC'
);
select extensions.ok(not has_table_privilege('authenticated', 'public.hq_projects', 'INSERT'), 'browser role has no direct project insert');
select extensions.ok(not has_table_privilege('authenticated', 'public.hq_projects', 'UPDATE'), 'browser role has no direct project update');
select extensions.ok(not has_table_privilege('authenticated', 'public.hq_projects', 'DELETE'), 'browser role cannot hard-delete projects');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444446', true);
select extensions.is((select count(*) from public.hq_projects), 0::bigint, 'other department member cannot read marketing project');
select extensions.throws_ok(
  $$select * from public.list_hq_project_owners('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing')$$,
  'P0001', 'Department access is required', 'other department member cannot list project owners'
);
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Wrong department')$$,
  'P0001', 'Project create access is required', 'other department member cannot create marketing project'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444447', true);
select extensions.is((select count(*) from public.hq_projects), 0::bigint, 'store manager has no implicit department project access');
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Store project')$$,
  'P0001', 'Project create access is required', 'store role alone cannot create department project'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444448', true);
select extensions.is((select count(*) from public.hq_projects), 0::bigint, 'inactive member cannot read project');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444449', true);
select extensions.is((select count(*) from public.hq_projects), 0::bigint, 'other organization admin cannot read project');
select extensions.throws_ok(
  $$select public.update_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 1, 'Changed', '', 'track', null, null, null, null)$$,
  'P0001', 'Project edit access is required', 'other organization admin cannot edit project'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444443', true);
select extensions.is((public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Member project')->>'revision')::integer, 1, 'department member creates project');
select extensions.is((select count(*) from public.hq_projects where created_by = '44444444-4444-4444-4444-444444444443'), 1::bigint, 'new project records creator');
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Bad URL', p_asana_url => 'javascript:alert(1)')$$,
  '23514', 'new row for relation "hq_projects" violates check constraint "hq_projects_asana_url_check"', 'database rejects non-web project links'
);
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Bad dates', p_start_date => date '2026-10-02', p_due_date => date '2026-10-01')$$,
  '23514', 'new row for relation "hq_projects" violates check constraint "hq_projects_check"', 'database rejects due date before start'
);
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', '   ')$$,
  '23514', 'new row for relation "hq_projects" violates check constraint "hq_projects_name_check"', 'database rejects blank project name'
);
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Bad owner', p_owner_id => '44444444-4444-4444-4444-444444444446')$$,
  'P0001', 'Project owner must be an active department writer', 'project owner must belong to department'
);
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Inactive owner', p_owner_id => '44444444-4444-4444-4444-444444444448')$$,
  'P0001', 'Project owner must be an active department writer', 'inactive account cannot own project'
);
select extensions.throws_ok(
  $$select public.create_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', 'Viewer owner', p_owner_id => '44444444-4444-4444-4444-444444444445')$$,
  'P0001', 'Project owner must be an active department writer', 'read-only viewer cannot own project'
);
select extensions.ok(not public.can_edit_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'marketing', '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444'), 'unrelated department member cannot edit existing project');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select extensions.is((public.update_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 1, 'Launch plan revised', 'Work in progress', 'risk', '44444444-4444-4444-4444-444444444444', null, null, null)->>'revision')::integer, 2, 'active owner updates project');
select extensions.throws_ok(
  $$select public.update_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 1, 'Stale', '', 'track', null, null, null, null)$$,
  'P0001', 'This project changed after it was loaded; refresh before saving', 'stale project edit is rejected'
);
select extensions.throws_ok(
  $$select public.update_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', null, 'Missing revision', '', 'track', null, null, null, null)$$,
  'P0001', 'This project changed after it was loaded; refresh before saving', 'missing revision cannot bypass edit conflict'
);
select extensions.throws_ok(
  $$select public.set_hq_project_archived('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 2, true)$$,
  'P0001', 'Project archive access is required', 'owner cannot archive without lead access'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444442', true);
select extensions.is((public.set_hq_project_archived('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 2, true)->>'revision')::integer, 3, 'lead archives project');
select extensions.ok((select archived_at from public.hq_projects where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1') is not null, 'archived project remains readable');
select extensions.throws_ok(
  $$select public.update_hq_project('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 3, 'Cannot edit', '', 'track', null, null, null, null)$$,
  'P0001', 'Restore this project before editing', 'archived project cannot be edited'
);
select extensions.throws_ok(
  $$select public.set_hq_project_archived('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 2, false)$$,
  'P0001', 'This project changed after it was loaded; refresh before saving', 'stale archive change is rejected'
);
select extensions.throws_ok(
  $$select public.set_hq_project_archived('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', null, false)$$,
  'P0001', 'This project changed after it was loaded; refresh before saving', 'missing revision cannot bypass archive conflict'
);
select extensions.is((public.set_hq_project_archived('dddddddd-dddd-dddd-dddd-dddddddddd01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 3, false)->>'revision')::integer, 4, 'lead restores project');
select extensions.ok((select archived_at from public.hq_projects where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1') is null, 'restored project is active again');
select extensions.ok(not has_function_privilege('anon', 'public.create_hq_project(uuid, text, text, text, uuid, date, date, text)', 'EXECUTE'), 'anonymous role cannot call create RPC');
select extensions.ok(not has_function_privilege('anon', 'public.list_hq_project_owners(uuid, text)', 'EXECUTE'), 'anonymous role cannot list owner candidates');

select * from extensions.finish();
rollback;
