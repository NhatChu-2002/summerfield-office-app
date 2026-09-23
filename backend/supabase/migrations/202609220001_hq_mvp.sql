-- Summerfield HQ MVP: department tasks and team updates.
-- Reuses the organization and department memberships already used by Team Reports.

create or replace function public.can_read_hq_department(
  p_organization_id uuid,
  p_department_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_org_role(
    p_organization_id, array['admin']::public.app_role[]
  ) or public.has_team_report_role(
    p_organization_id, p_department_code, array['viewer', 'member', 'lead']::text[]
  );
$$;

create or replace function public.can_write_hq_department(
  p_organization_id uuid,
  p_department_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_org_role(
    p_organization_id, array['admin']::public.app_role[]
  ) or public.has_team_report_role(
    p_organization_id, p_department_code, array['member', 'lead']::text[]
  );
$$;

create or replace function public.can_manage_hq_department(
  p_organization_id uuid,
  p_department_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_org_role(
    p_organization_id, array['admin']::public.app_role[]
  ) or public.has_team_report_role(
    p_organization_id, p_department_code, array['lead']::text[]
  );
$$;

create table if not exists public.hq_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_code text not null check (department_code in (
    'operations', 'marketing', 'research_and_development', 'admin_and_payroll',
    'design', 'build_out', 'pr_and_partnerships', 'executive_assistant',
    'finance', 'warehouse_and_spend', 'equipment_and_maintenance', 'store_manager'
  )),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  details text not null default '' check (char_length(details) <= 4000),
  due_date date,
  status text not null default 'open' check (status in ('open', 'done')),
  assigned_to uuid references public.user_profiles(id) on delete set null,
  created_by uuid not null references public.user_profiles(id),
  revision integer not null default 1 check (revision > 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'done') = (completed_at is not null))
);

create index if not exists hq_tasks_department_idx
  on public.hq_tasks (organization_id, department_code, status, due_date);
create index if not exists hq_tasks_assignee_idx
  on public.hq_tasks (organization_id, assigned_to, status, due_date);

create or replace function public.validate_hq_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_to is not null and not exists (
    select 1
    from public.organization_memberships member
    join public.user_profiles profile on profile.id = member.user_id
    where member.organization_id = new.organization_id
      and member.user_id = new.assigned_to
      and member.is_active
      and profile.is_active
      and (
        member.role = 'admin'
        or exists (
          select 1 from public.team_report_memberships department_member
          where department_member.organization_id = new.organization_id
            and department_member.department_code = new.department_code
            and department_member.user_id = new.assigned_to
            and department_member.is_active
        )
      )
  ) then
    raise exception 'Assignee must be an active member of this department';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_hq_task_assignee on public.hq_tasks;
create trigger validate_hq_task_assignee
  before insert or update of organization_id, department_code, assigned_to
  on public.hq_tasks
  for each row execute function public.validate_hq_task_assignee();

create table if not exists public.hq_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_code text not null check (department_code in (
    'operations', 'marketing', 'research_and_development', 'admin_and_payroll',
    'design', 'build_out', 'pr_and_partnerships', 'executive_assistant',
    'finance', 'warehouse_and_spend', 'equipment_and_maintenance', 'store_manager'
  )),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  author_name text not null,
  created_by uuid not null references public.user_profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists hq_updates_department_idx
  on public.hq_updates (organization_id, department_code, created_at desc);

create or replace function public.set_hq_update_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := (select auth.uid());
  select coalesce(nullif(btrim(profile.display_name), ''), 'Team member')
    into new.author_name
  from public.user_profiles profile
  where profile.id = new.created_by and profile.is_active;
  if new.author_name is null then
    raise exception 'An active user profile is required';
  end if;
  return new;
end;
$$;

drop trigger if exists set_hq_update_author on public.hq_updates;
create trigger set_hq_update_author
  before insert on public.hq_updates
  for each row execute function public.set_hq_update_author();

alter table public.hq_tasks enable row level security;
alter table public.hq_updates enable row level security;
revoke all on public.hq_tasks, public.hq_updates from anon, authenticated;
grant select, insert on public.hq_tasks, public.hq_updates to authenticated;
grant all on public.hq_tasks, public.hq_updates to service_role;

drop policy if exists hq_tasks_read on public.hq_tasks;
create policy hq_tasks_read on public.hq_tasks
  for select to authenticated using (
    public.can_read_hq_department(organization_id, department_code)
  );
drop policy if exists hq_tasks_insert on public.hq_tasks;
create policy hq_tasks_insert on public.hq_tasks
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and status = 'open'
    and completed_at is null
    and revision = 1
    and public.can_write_hq_department(organization_id, department_code)
  );

drop policy if exists hq_updates_read on public.hq_updates;
create policy hq_updates_read on public.hq_updates
  for select to authenticated using (
    public.can_read_hq_department(organization_id, department_code)
  );
drop policy if exists hq_updates_insert on public.hq_updates;
create policy hq_updates_insert on public.hq_updates
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and public.can_write_hq_department(organization_id, department_code)
  );

create or replace function public.list_hq_department_people(
  p_organization_id uuid,
  p_department_code text
)
returns table (user_id uuid, display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_read_hq_department(p_organization_id, p_department_code) then
    raise exception 'Department access is required';
  end if;
  return query
  select member.user_id,
    coalesce(nullif(btrim(profile.display_name), ''), 'Team member')::text
  from public.organization_memberships member
  join public.user_profiles profile on profile.id = member.user_id and profile.is_active
  where member.organization_id = p_organization_id
    and member.is_active
    and (
      member.role = 'admin'
      or exists (
        select 1 from public.team_report_memberships department_member
        where department_member.organization_id = p_organization_id
          and department_member.department_code = p_department_code
          and department_member.user_id = member.user_id
          and department_member.is_active
      )
    )
  order by lower(coalesce(nullif(btrim(profile.display_name), ''), 'Team member')),
    member.user_id;
end;
$$;

create or replace function public.set_hq_task_status(
  p_organization_id uuid,
  p_task_id uuid,
  p_expected_revision integer,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.hq_tasks%rowtype;
begin
  if p_status not in ('open', 'done') then
    raise exception 'Invalid task status';
  end if;
  select task.* into v_task
  from public.hq_tasks task
  where task.id = p_task_id and task.organization_id = p_organization_id
  for update;
  if not found then raise exception 'Task not found'; end if;
  if not public.can_read_hq_department(v_task.organization_id, v_task.department_code)
    or not (
      public.can_manage_hq_department(v_task.organization_id, v_task.department_code)
      or v_task.created_by = (select auth.uid())
      or v_task.assigned_to = (select auth.uid())
    ) then
    raise exception 'Task update access is required';
  end if;
  if v_task.revision <> p_expected_revision then
    raise exception 'This task changed after it was loaded; refresh before saving';
  end if;
  if v_task.status = p_status then return to_jsonb(v_task); end if;
  update public.hq_tasks task
  set status = p_status,
      completed_at = case when p_status = 'done' then now() else null end,
      revision = task.revision + 1,
      updated_at = now()
  where task.id = v_task.id
  returning task.* into v_task;
  return to_jsonb(v_task);
end;
$$;

revoke all on function public.can_read_hq_department(uuid, text) from public, anon;
revoke all on function public.can_write_hq_department(uuid, text) from public, anon;
revoke all on function public.can_manage_hq_department(uuid, text) from public, anon;
revoke all on function public.validate_hq_task_assignee() from public, anon;
revoke all on function public.set_hq_update_author() from public, anon;
revoke all on function public.list_hq_department_people(uuid, text) from public, anon;
revoke all on function public.set_hq_task_status(uuid, uuid, integer, text) from public, anon;
grant execute on function public.can_read_hq_department(uuid, text) to authenticated, service_role;
grant execute on function public.can_write_hq_department(uuid, text) to authenticated, service_role;
grant execute on function public.can_manage_hq_department(uuid, text) to authenticated, service_role;
grant execute on function public.list_hq_department_people(uuid, text) to authenticated, service_role;
grant execute on function public.set_hq_task_status(uuid, uuid, integer, text) to authenticated, service_role;
