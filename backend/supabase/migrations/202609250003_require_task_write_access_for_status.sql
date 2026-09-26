-- Assigned viewers can read tasks but must not change their status.
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
  if not public.can_write_hq_department(v_task.organization_id, v_task.department_code)
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

revoke all on function public.set_hq_task_status(uuid, uuid, integer, text) from public, anon;
grant execute on function public.set_hq_task_status(uuid, uuid, integer, text) to authenticated, service_role;
