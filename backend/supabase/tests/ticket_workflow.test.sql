begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('33333333-3333-3333-3333-333333333331', 'ticket-manager@example.test', '{"display_name":"Ticket manager"}'),
  ('33333333-3333-3333-3333-333333333332', 'ticket-lead@example.test', '{"display_name":"Ticket lead"}'),
  ('33333333-3333-3333-3333-333333333333', 'ticket-admin@example.test', '{"display_name":"Ticket admin"}'),
  ('33333333-3333-3333-3333-333333333334', 'ticket-member@example.test', '{"display_name":"Ticket member"}'),
  ('33333333-3333-3333-3333-333333333335', 'ticket-other@example.test', '{"display_name":"Other admin"}');

insert into public.organizations (id, slug, name) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ticket-one', 'Ticket One'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'ticket-two', 'Ticket Two');

insert into public.organization_memberships (organization_id, user_id, role) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333331', 'manager'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333332', 'viewer'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333333', 'admin'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333334', 'viewer'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '33333333-3333-3333-3333-333333333335', 'admin');

insert into public.team_report_memberships (organization_id, department_code, user_id, team_role) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'marketing', '33333333-3333-3333-3333-333333333332', 'lead'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'marketing', '33333333-3333-3333-3333-333333333334', 'member');

insert into public.stores (id, organization_id, code, name) values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'one', 'Store One'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'two', 'Store Two'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'three', 'Store Three');

insert into public.store_memberships (store_id, user_id) values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', '33333333-3333-3333-3333-333333333331');

insert into public.tickets (id, organization_id, store_id, department_code, category, priority, title, reported_by) values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'marketing', 'facility', 'normal', 'Fixed test ticket', '33333333-3333-3333-3333-333333333331'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'finance', 'supply', 'high', 'Finance ticket', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'ffffffff-ffff-ffff-ffff-fffffffffff3', 'marketing', 'facility', 'normal', 'Other organization', '33333333-3333-3333-3333-333333333335');

set local role authenticated;

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333331', true);
select extensions.ok(public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1'), 'manager can submit for assigned active store');
select extensions.ok(not public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2'), 'manager cannot submit for unassigned store');
select extensions.is((public.create_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'marketing', 'equipment', 'urgent', 'Broken cooler', 'Does not cool')->>'status'), 'open', 'store manager submits ticket through RPC');
select extensions.throws_ok(
  $$select public.create_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'marketing', 'equipment', 'normal', 'Wrong store')$$,
  'P0001', 'Ticket submission access is required for this store', 'store assignment is enforced by RPC'
);
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 2::bigint, 'manager sees own tickets but not another reporter');
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3') is null, 'manager cannot open another reporter ticket');
select extensions.throws_ok(
  $$select public.update_ticket_status('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 1, 'acknowledged')$$,
  'P0001', 'Ticket review access is required', 'reporter cannot triage without lead access'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333332', true);
select extensions.ok(not public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1'), 'department lead alone cannot submit store ticket');
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 2::bigint, 'lead sees marketing tickets, including manager submission');
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3') is null, 'lead cannot read finance ticket');
select extensions.is((public.update_ticket_status('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 1, 'acknowledged', 'Looking into it')->>'revision')::integer, 2, 'lead changes status with expected revision');
select extensions.throws_ok(
  $$select public.update_ticket_status('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 1, 'in_progress')$$,
  'P0001', 'This ticket changed after it was loaded; reload before saving', 'stale status revision is rejected'
);
select extensions.throws_ok(
  $$select public.update_ticket_status('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 2, 'resolved')$$,
  'P0001', 'Cannot move a ticket from acknowledged to resolved', 'illegal status jump is rejected'
);
select extensions.is((public.assign_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 2, '33333333-3333-3333-3333-333333333334')->>'revision')::integer, 3, 'lead assigns an active teammate');
select extensions.is((select count(*) from public.list_ticket_events('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 2::bigint, 'status and assignment are recorded as events');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 3::bigint, 'organization admin sees every own-organization ticket');
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_status => 'acknowledged')), 1::bigint, 'server status filter narrows queue');
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'cccccccc-cccc-cccc-cccc-ccccccccccc4') is null, 'admin cannot open another organization ticket');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333335', true);
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2') is null, 'other-organization admin cannot open ticket');
select extensions.throws_ok(
  $$select * from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')$$,
  'P0001', 'Organization access is required', 'other-organization list is rejected'
);
select extensions.ok(not has_table_privilege('authenticated', 'public.tickets', 'INSERT'), 'authenticated users cannot insert tickets outside RPC');
select extensions.ok(not has_function_privilege('anon', 'public.create_ticket(uuid, uuid, text, text, text, text, text)', 'EXECUTE'), 'anonymous users cannot call ticket creation RPC');

select * from extensions.finish();
rollback;
