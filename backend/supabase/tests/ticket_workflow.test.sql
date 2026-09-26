begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('33333333-3333-3333-3333-333333333331', 'ticket-manager@example.test', '{"display_name":"Ticket manager"}'),
  ('33333333-3333-3333-3333-333333333332', 'ticket-lead@example.test', '{"display_name":"Ticket lead"}'),
  ('33333333-3333-3333-3333-333333333333', 'ticket-admin@example.test', '{"display_name":"Ticket admin"}'),
  ('33333333-3333-3333-3333-333333333334', 'ticket-member@example.test', '{"display_name":"Ticket member"}'),
  ('33333333-3333-3333-3333-333333333335', 'ticket-other@example.test', '{"display_name":"Other admin"}'),
  ('33333333-3333-3333-3333-333333333336', 'ticket-inactive@example.test', '{"display_name":"Inactive teammate"}');

insert into public.organizations (id, slug, name) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ticket-one', 'Ticket One'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'ticket-two', 'Ticket Two');

insert into public.organization_memberships (organization_id, user_id, role, is_active) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333331', 'manager', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333332', 'viewer', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333333', 'admin', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333334', 'viewer', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '33333333-3333-3333-3333-333333333335', 'admin', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '33333333-3333-3333-3333-333333333336', 'viewer', false);

insert into public.team_report_memberships (organization_id, department_code, user_id, team_role) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'marketing', '33333333-3333-3333-3333-333333333332', 'lead'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'marketing', '33333333-3333-3333-3333-333333333334', 'member');

insert into public.stores (id, organization_id, code, name, is_active) values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'one', 'Store One', true),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'two', 'Store Two', true),
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'three', 'Store Three', true),
  ('ffffffff-ffff-ffff-ffff-fffffffffff4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'four', 'Inactive Store', false);

insert into public.store_memberships (store_id, user_id) values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', '33333333-3333-3333-3333-333333333331'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff4', '33333333-3333-3333-3333-333333333331');

insert into public.tickets (id, organization_id, store_id, department_code, category, priority, title, reported_by) values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'marketing', 'facility', 'normal', 'Fixed test ticket', '33333333-3333-3333-3333-333333333331'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'finance', 'supply', 'high', 'Finance ticket', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'ffffffff-ffff-ffff-ffff-fffffffffff3', 'marketing', 'facility', 'normal', 'Other organization', '33333333-3333-3333-3333-333333333335');

insert into public.tickets (id, organization_id, store_id, department_code, category, priority, title, reported_by, assignee_id) values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'finance', 'supply', 'low', 'Former teammate assignment', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333336');

insert into public.ticket_photos (organization_id, ticket_id, storage_path, content_sha256, mime_type, byte_size) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1/cccccccc-cccc-cccc-cccc-ccccccccccc2/test.jpg', repeat('a', 64), 'image/jpeg', 100);

set local role authenticated;

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333331', true);
select extensions.ok(public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1'), 'manager can submit for assigned active store');
select extensions.ok(not public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2'), 'manager cannot submit for unassigned store');
select extensions.ok(not public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff4'), 'manager cannot submit for an assigned but inactive store');
select extensions.is((public.create_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'marketing', 'equipment', 'urgent', 'Broken cooler', 'Does not cool')->>'status'), 'open', 'store manager submits ticket through RPC');
select extensions.throws_ok(
  $$select public.create_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'marketing', 'equipment', 'normal', 'Wrong store')$$,
  'P0001', 'Ticket submission access is required for this store', 'store assignment is enforced by RPC'
);
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 2::bigint, 'manager sees own tickets but not another reporter');
select extensions.is((select count(*) from public.list_ticket_page('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 2::bigint, 'paged queue preserves manager visibility');
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3') is null, 'manager cannot open another reporter ticket');
select extensions.throws_ok(
  $$select public.update_ticket_status('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 1, 'acknowledged')$$,
  'P0001', 'Ticket review access is required', 'reporter cannot triage without lead access'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333334', true);
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 0::bigint, 'ordinary team member sees no unassigned department tickets');
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2') is null, 'ordinary team member cannot open ticket before assignment');
select extensions.is((select count(*) from public.list_ticket_events('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 0::bigint, 'ordinary team member cannot read activity before assignment');
select extensions.is((select count(*) from public.list_ticket_photos('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 0::bigint, 'ordinary team member cannot read photos before assignment');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333332', true);
select extensions.ok(public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1'), 'department lead can submit store ticket');
select extensions.ok(public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2'), 'department lead can submit for another active store');
select extensions.ok(not public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff4'), 'department lead cannot submit for inactive store');
select extensions.is((select count(*) from public.list_ticket_stores('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 2::bigint, 'lead store picker includes all active organization stores');
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 4::bigint, 'lead sees tickets across organization departments');
select extensions.is((select count(*) from public.list_ticket_page('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_limit => 2)), 2::bigint, 'lead receives bounded first page');
select extensions.is((select ticket_id from public.list_ticket_page('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_limit => 2) offset 1 limit 1), 'cccccccc-cccc-cccc-cccc-ccccccccccc3'::uuid, 'page orders urgent before high-priority finance ticket');
select extensions.is((select count(*) from public.list_ticket_page(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_cursor_priority => 1,
  p_cursor_created_at => (select created_at from public.tickets where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc3'),
  p_cursor_id => 'cccccccc-cccc-cccc-cccc-ccccccccccc3', p_limit => 2
)), 2::bigint, 'cursor returns remaining tickets without repeating first page');
select extensions.is((select count(*) from public.list_ticket_page('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_department_code => 'finance')), 2::bigint, 'paged queue filters department');
select extensions.is((select count(*) from public.list_ticket_page('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_store_id => 'ffffffff-ffff-ffff-ffff-fffffffffff2')), 2::bigint, 'paged queue filters store');
select extensions.throws_ok(
  $$select * from public.list_ticket_page('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_cursor_priority => 1)$$,
  'P0001', 'Complete ticket cursor is required', 'partial queue cursor is rejected'
);
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3') is not null, 'lead can read finance ticket');
select extensions.throws_ok(
  $$select public.update_ticket_status('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 1, 'acknowledged')$$,
  'P0001', 'Ticket review access is required', 'organization visibility does not grant other-department status write'
);
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
select extensions.throws_ok(
  $$select public.assign_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 3, '33333333-3333-3333-3333-333333333331')$$,
  'P0001', 'Assignee must be an active member of this department', 'assignment rejects teammate outside ticket department'
);
select extensions.is((select count(*) from public.list_ticket_events('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 2::bigint, 'status and assignment are recorded as events');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333334', true);
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 1::bigint, 'assigned member finds the ticket in the queue');
select extensions.is((public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')->>'assignee_id'), '33333333-3333-3333-3333-333333333334', 'assigned member opens ticket detail');
select extensions.is((select count(*) from public.tickets where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2'), 1::bigint, 'direct ticket SELECT grants assigned member RLS access');
select extensions.is((select count(*) from public.list_ticket_events('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 2::bigint, 'assigned member can read activity');
select extensions.is((select count(*) from public.list_ticket_photos('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 1::bigint, 'assigned member can read photo metadata');
select extensions.throws_ok(
  $$select public.update_ticket_status('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 3, 'in_progress')$$,
  'P0001', 'Ticket review access is required', 'assignment does not grant status write access'
);
select extensions.throws_ok(
  $$select public.assign_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 3, null)$$,
  'P0001', 'Ticket review access is required', 'assignment does not grant reassignment access'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333332', true);
select extensions.is((public.assign_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 3, null)->>'revision')::integer, 4, 'lead can clear an assignment');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333334', true);
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 0::bigint, 'former assignee loses queue access');
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2') is null, 'former assignee loses detail access');
select extensions.is((select count(*) from public.list_ticket_events('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 0::bigint, 'former assignee loses activity access');
select extensions.is((select count(*) from public.list_ticket_photos('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2')), 0::bigint, 'former assignee loses photo metadata access');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333336', true);
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc5') is null, 'inactive assignee cannot open ticket');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333331', true);
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2') is not null, 'reporter retains read access after assigning a teammate');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 4::bigint, 'organization admin sees every own-organization ticket');
select extensions.is((select count(*) from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', p_status => 'acknowledged')), 1::bigint, 'server status filter narrows queue');
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'cccccccc-cccc-cccc-cccc-ccccccccccc4') is null, 'admin cannot open another organization ticket');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333335', true);
select extensions.ok(public.get_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2') is null, 'other-organization admin cannot open ticket');
select extensions.throws_ok(
  $$select * from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')$$,
  'P0001', 'Organization access is required', 'other-organization list is rejected'
);
select extensions.throws_ok(
  $$select * from public.list_ticket_page('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')$$,
  'P0001', 'Organization access is required', 'other-organization paged queue is rejected'
);
select extensions.ok(not has_table_privilege('authenticated', 'public.tickets', 'INSERT'), 'authenticated users cannot insert tickets outside RPC');
select extensions.ok(not has_function_privilege('anon', 'public.create_ticket(uuid, uuid, text, text, text, text, text)', 'EXECUTE'), 'anonymous users cannot call ticket creation RPC');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333331', true);
select extensions.is((select count(*) from public.list_ticket_stores('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')), 1::bigint, 'manager store picker remains limited to assigned active store');
select extensions.throws_ok(
  $$select public.reroute_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 4, 'finance')$$,
  'P0001', 'Ticket routing access is required', 'manager cannot reroute a submitted ticket'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333334', true);
select extensions.ok(not public.can_submit_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1'), 'ordinary member cannot submit in lead-only slice');
select extensions.throws_ok(
  $$select public.reroute_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 4, 'finance')$$,
  'P0001', 'Ticket routing access is required', 'ordinary member cannot reroute'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333332', true);
select extensions.throws_ok(
  $$select public.reroute_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 3, 'finance')$$,
  'P0001', 'This ticket changed after it was loaded; reload before saving', 'reroute rejects stale revision'
);
select extensions.throws_ok(
  $$select public.reroute_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 4, 'hr')$$,
  'P0001', 'Invalid ticket department', 'preview-only department cannot receive live ticket'
);
select extensions.is((public.reroute_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 4, 'finance')->>'revision')::integer, 5, 'lead reroutes another reporter ticket');
select extensions.is((select department_code from public.tickets where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2'), 'finance', 'reroute changes ticket department');
select extensions.is((select count(*) from public.ticket_events where ticket_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2' and event_type = 'routed'), 1::bigint, 'reroute records activity');
select extensions.is((select count(*) from public.list_ticket_events('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc2') where event_type = 'routed'), 1::bigint, 'lead reads routing activity');
select extensions.is((public.reroute_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc5', 1, 'marketing')->>'assignee_id'), null::text, 'rerouting clears the former department assignee');
select extensions.is((select count(*) from public.ticket_events where ticket_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc5' and event_type in ('routed', 'assigned')), 2::bigint, 'rerouting an assigned ticket records route and unassignment');
select extensions.is((public.create_ticket('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'finance', 'facility', 'normal', 'Other team request')->>'department_code'), 'finance', 'lead can submit to another department');
select extensions.throws_ok(
  $$select public.create_ticket_with_assignment('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'finance', 'facility', 'normal', 'Cannot assign there', '33333333-3333-3333-3333-333333333334')$$,
  'P0001', 'Ticket assignment access is required for this department', 'lead cannot assign in another department'
);
select extensions.is((select count(*) from public.tickets where title = 'Cannot assign there'), 0::bigint, 'rejected assign-on-submit leaves no ticket');
select extensions.is((public.create_ticket_with_assignment('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'marketing', 'facility', 'normal', 'Team request', '33333333-3333-3333-3333-333333333334')->>'assignee_id'), '33333333-3333-3333-3333-333333333334', 'lead submits and assigns teammate atomically');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333336', true);
select extensions.throws_ok(
  $$select * from public.list_tickets('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')$$,
  'P0001', 'Organization access is required', 'inactive user cannot list organization tickets'
);
select extensions.throws_ok(
  $$select * from public.list_ticket_stores('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1')$$,
  'P0001', 'Organization access is required', 'inactive user cannot list submission stores'
);
select extensions.ok(not has_function_privilege('anon', 'public.reroute_ticket(uuid, uuid, integer, text)', 'EXECUTE'), 'anonymous user cannot reroute');

select * from extensions.finish();
rollback;
