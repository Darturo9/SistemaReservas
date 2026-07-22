create or replace function public.list_public_available_slots(
  p_location_id uuid,
  p_service_id uuid,
  p_date date,
  p_resource_id uuid default null,
  p_interval_minutes smallint default 15
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  available_resource_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_tenant_id uuid;
  location_timezone text;
  service_duration_minutes smallint;
  service_buffer_before_minutes smallint;
  service_buffer_after_minutes smallint;
begin
  if p_interval_minutes not between 5 and 60 then
    return;
  end if;

  select location.tenant_id, location.timezone
  into selected_tenant_id, location_timezone
  from public.locations as location
  where location.id = p_location_id
    and location.is_active;

  if selected_tenant_id is null
    or p_date < (now() at time zone location_timezone)::date
    or p_date > (now() at time zone location_timezone)::date + 90 then
    return;
  end if;

  select
    service.duration_minutes,
    service.buffer_before_minutes,
    service.buffer_after_minutes
  into
    service_duration_minutes,
    service_buffer_before_minutes,
    service_buffer_after_minutes
  from public.services as service
  where service.tenant_id = selected_tenant_id
    and service.id = p_service_id
    and service.is_active;

  if service_duration_minutes is null then
    return;
  end if;

  perform private.expire_pending_bookings();

  return query
  with candidate_slots as (
    select
      local_start at time zone location_timezone as candidate_starts_at,
      (local_start + make_interval(mins => service_duration_minutes))
        at time zone location_timezone as candidate_ends_at
    from generate_series(
      p_date::timestamp,
      p_date::timestamp + interval '1 day'
        - make_interval(mins => service_duration_minutes),
      make_interval(mins => p_interval_minutes)
    ) as slot(local_start)
  ), compatible_resources as (
    select resource.id
    from public.resources as resource
    join public.service_resources as service_resource
      on service_resource.tenant_id = resource.tenant_id
      and service_resource.resource_id = resource.id
    where resource.tenant_id = selected_tenant_id
      and resource.location_id = p_location_id
      and resource.is_active
      and service_resource.service_id = p_service_id
      and (p_resource_id is null or resource.id = p_resource_id)
  )
  select
    candidate_slot.candidate_starts_at,
    candidate_slot.candidate_ends_at,
    count(resource.id)::integer
  from candidate_slots as candidate_slot
  cross join compatible_resources as resource
  where private.resource_is_available_at(
    selected_tenant_id,
    p_location_id,
    resource.id,
    candidate_slot.candidate_starts_at,
    candidate_slot.candidate_ends_at,
    service_buffer_before_minutes,
    service_buffer_after_minutes
  )
  group by candidate_slot.candidate_starts_at, candidate_slot.candidate_ends_at
  order by candidate_slot.candidate_starts_at;
end;
$$;
