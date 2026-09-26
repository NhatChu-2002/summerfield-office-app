-- Shared HQ projects. Asana is an optional link, not the record owner.
create table public.hq_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_code text not null check (department_code in (
    'operations', 'marketing', 'research_and_development', 'admin_and_payroll',
    'design', 'build_out', 'pr_and_partnerships', 'executive_assistant',
    'finance', 'warehouse_and_spend', 'equipment_and_maintenance', 'store_manager'
  )),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'track' check (status in ('track', 'risk', 'blocked', 'done')),
  owner_id uuid references public.user_profiles(id),
  start_date date,
  due_date date,
  asana_url text check (asana_url is null or (char_length(asana_url) <= 2000 and asana_url ~* '^https?://[^[:space:]]+$')),
  revision integer not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_by uuid not null references public.user_profiles(id),
  updated_by uuid not null references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date is null or due_date is null or due_date >= start_date)
);

create index hq_projects_department_updated_idx
  on public.hq_projects (organization_id, department_code, updated_at desc, id desc);
create index hq_projects_owner_idx
  on public.hq_projects (organization_id, owner_id, archived_at);

create function public.validate_hq_project_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null and not exists (
    select 1
    from public.organization_memberships member
    join public.user_profiles profile on profile.id = member.user_id
    where member.organization_id = new.organization_id
      and member.user_id = new.owner_id
      and member.is_active and profile.is_active
      and (
        member.role = 'admin'
        or exists (
          select 1 from public.team_report_memberships department_member
          where department_member.organization_id = new.organization_id
            and department_member.department_code = new.department_code
            and department_member.user_id = new.owner_id
            and department_member.is_active
            and department_member.team_role in ('member', 'lead')
        )
      )
  ) then
    raise exception 'Project owner must be an active department writer';
  end if;
  return new;
end;
$$;

create trigger validate_hq_project_owner
  before insert or update of organization_id, department_code, owner_id
  on public.hq_projects
  for each row execute function public.validate_hq_project_owner();

create function public.can_edit_hq_project(
  p_organization_id uuid, p_department_code text, p_created_by uuid, p_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_write_hq_department(p_organization_id, p_department_code)
    and (
      public.can_manage_hq_department(p_organization_id, p_department_code)
      or p_created_by = (select auth.uid())
      or p_owner_id = (select auth.uid())
    );
$$;

create function public.list_hq_project_owners(p_organization_id uuid, p_department_code text)
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
          and department_member.team_role in ('member', 'lead')
      )
    )
  order by lower(coalesce(nullif(btrim(profile.display_name), ''), 'Team member')),
    member.user_id;
end;
$$;

alter table public.hq_projects enable row level security;
revoke all on public.hq_projects from anon, authenticated;
grant select on public.hq_projects to authenticated;
grant all on public.hq_projects to service_role;

create policy hq_projects_read on public.hq_projects for select to authenticated using (
  public.can_read_hq_department(organization_id, department_code)
);

create function public.create_hq_project(
  p_organization_id uuid, p_department_code text, p_name text,
  p_description text default '', p_owner_id uuid default null,
  p_start_date date default null, p_due_date date default null,
  p_asana_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.hq_projects%rowtype;
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not public.can_write_hq_department(p_organization_id, p_department_code) then
    raise exception 'Project create access is required';
  end if;
  insert into public.hq_projects (
    organization_id, department_code, name, description, owner_id,
    start_date, due_date, asana_url, created_by, updated_by
  ) values (
    p_organization_id, p_department_code, btrim(p_name), btrim(coalesce(p_description, '')),
    coalesce(p_owner_id, v_actor), p_start_date, p_due_date,
    nullif(btrim(p_asana_url), ''), v_actor, v_actor
  ) returning * into v_project;
  return to_jsonb(v_project);
end;
$$;

create function public.update_hq_project(
  p_organization_id uuid, p_project_id uuid, p_expected_revision integer,
  p_name text, p_description text, p_status text, p_owner_id uuid,
  p_start_date date, p_due_date date, p_asana_url text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.hq_projects%rowtype;
begin
  select * into v_project from public.hq_projects
  where id = p_project_id and organization_id = p_organization_id for update;
  if not found then raise exception 'Project not found'; end if;
  if not public.can_edit_hq_project(
    v_project.organization_id, v_project.department_code, v_project.created_by, v_project.owner_id
  ) then raise exception 'Project edit access is required'; end if;
  if v_project.revision is distinct from p_expected_revision then
    raise exception 'This project changed after it was loaded; refresh before saving';
  end if;
  if v_project.archived_at is not null then raise exception 'Restore this project before editing'; end if;
  update public.hq_projects set
    name = btrim(p_name), description = btrim(coalesce(p_description, '')),
    status = p_status, owner_id = p_owner_id,
    start_date = p_start_date, due_date = p_due_date,
    asana_url = nullif(btrim(p_asana_url), ''),
    revision = revision + 1, updated_by = (select auth.uid()), updated_at = now()
  where id = p_project_id returning * into v_project;
  return to_jsonb(v_project);
end;
$$;

create function public.set_hq_project_archived(
  p_organization_id uuid, p_project_id uuid, p_expected_revision integer, p_archived boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.hq_projects%rowtype;
begin
  if p_archived is null then raise exception 'Archive state is required'; end if;
  select * into v_project from public.hq_projects
  where id = p_project_id and organization_id = p_organization_id for update;
  if not found then raise exception 'Project not found'; end if;
  if not public.can_manage_hq_department(v_project.organization_id, v_project.department_code) then
    raise exception 'Project archive access is required';
  end if;
  if v_project.revision is distinct from p_expected_revision then
    raise exception 'This project changed after it was loaded; refresh before saving';
  end if;
  if (v_project.archived_at is not null) = p_archived then return to_jsonb(v_project); end if;
  update public.hq_projects set
    archived_at = case when p_archived then now() else null end,
    revision = revision + 1, updated_by = (select auth.uid()), updated_at = now()
  where id = p_project_id returning * into v_project;
  return to_jsonb(v_project);
end;
$$;

revoke all on function public.validate_hq_project_owner() from public, anon;
revoke all on function public.can_edit_hq_project(uuid, text, uuid, uuid) from public, anon;
revoke all on function public.list_hq_project_owners(uuid, text) from public, anon;
revoke all on function public.create_hq_project(uuid, text, text, text, uuid, date, date, text) from public, anon;
revoke all on function public.update_hq_project(uuid, uuid, integer, text, text, text, uuid, date, date, text) from public, anon;
revoke all on function public.set_hq_project_archived(uuid, uuid, integer, boolean) from public, anon;
grant execute on function public.can_edit_hq_project(uuid, text, uuid, uuid) to authenticated, service_role;
grant execute on function public.list_hq_project_owners(uuid, text) to authenticated, service_role;
grant execute on function public.create_hq_project(uuid, text, text, text, uuid, date, date, text) to authenticated, service_role;
grant execute on function public.update_hq_project(uuid, uuid, integer, text, text, text, uuid, date, date, text) to authenticated, service_role;
grant execute on function public.set_hq_project_archived(uuid, uuid, integer, boolean) to authenticated, service_role;

notify pgrst, 'reload schema';
