create or replace function public.create_service_with_resources(
  p_tenant_id uuid,
  p_name text,
  p_description text,
  p_duration_minutes smallint,
  p_buffer_before_minutes smallint,
  p_buffer_after_minutes smallint,
  p_price_cents integer,
  p_approval_policy public.service_approval_policy,
  p_allow_client_cancellation boolean,
  p_allow_client_rescheduling boolean,
  p_cancellation_notice_minutes integer,
  p_resource_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  service_id uuid;
  normalized_name text := trim(p_name);
  normalized_description text := nullif(trim(p_description), '');
  resource_count integer := cardinality(p_resource_ids);
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if not (select private.is_organization_admin(p_tenant_id)) then
    raise exception 'Organization administrator access is required.' using errcode = '42501';
  end if;

  if resource_count is null or resource_count = 0 then
    raise exception 'At least one compatible resource is required.' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.resources as resource
    where resource.tenant_id = p_tenant_id
      and resource.id = any (p_resource_ids)
      and resource.is_active
  ) <> resource_count then
    raise exception 'Every compatible resource must be active and belong to the organization.'
      using errcode = '22023';
  end if;

  insert into public.services (
    tenant_id,
    name,
    description,
    duration_minutes,
    buffer_before_minutes,
    buffer_after_minutes,
    price_cents,
    currency,
    approval_policy,
    allow_client_cancellation,
    allow_client_rescheduling,
    cancellation_notice_minutes
  )
  values (
    p_tenant_id,
    normalized_name,
    normalized_description,
    p_duration_minutes,
    p_buffer_before_minutes,
    p_buffer_after_minutes,
    p_price_cents,
    'GTQ',
    p_approval_policy,
    p_allow_client_cancellation,
    p_allow_client_rescheduling,
    p_cancellation_notice_minutes
  )
  returning id into service_id;

  insert into public.service_resources (tenant_id, service_id, resource_id)
  select p_tenant_id, service_id, resource_id
  from unnest(p_resource_ids) as resource_id;

  return service_id;
end;
$$;

revoke all on function public.create_service_with_resources(
  uuid,
  text,
  text,
  smallint,
  smallint,
  smallint,
  integer,
  public.service_approval_policy,
  boolean,
  boolean,
  integer,
  uuid[]
) from public;

grant execute on function public.create_service_with_resources(
  uuid,
  text,
  text,
  smallint,
  smallint,
  smallint,
  integer,
  public.service_approval_policy,
  boolean,
  boolean,
  integer,
  uuid[]
) to authenticated;
