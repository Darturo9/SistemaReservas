alter table public.organizations
  add column booking_slug text,
  add column is_booking_public boolean not null default false,
  add constraint organizations_booking_slug_format check (
    booking_slug is null
    or (
      char_length(booking_slug) between 3 and 64
      and booking_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    )
  ),
  add constraint organizations_public_booking_requires_slug check (
    not is_booking_public or booking_slug is not null
  );

create unique index organizations_booking_slug_key
  on public.organizations (lower(booking_slug))
  where booking_slug is not null;

grant update (name, booking_slug, is_booking_public)
  on public.organizations to authenticated;

create or replace function private.audit_organization_booking_page_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data
  )
  values (
    new.id,
    (select auth.uid()),
    'organization.public_booking_page_updated',
    'organizations',
    new.id,
    jsonb_build_object(
      'booking_slug', old.booking_slug,
      'is_booking_public', old.is_booking_public
    ),
    jsonb_build_object(
      'booking_slug', new.booking_slug,
      'is_booking_public', new.is_booking_public
    )
  );

  return new;
end;
$$;

revoke all on function private.audit_organization_booking_page_change() from public;

create trigger audit_organization_booking_page_change
after update of booking_slug, is_booking_public on public.organizations
for each row
when (
  old.booking_slug is distinct from new.booking_slug
  or old.is_booking_public is distinct from new.is_booking_public
)
execute function private.audit_organization_booking_page_change();

create or replace function public.get_public_booking_catalog(p_booking_slug text)
returns table (
  organization_name text,
  location_id uuid,
  location_name text,
  location_timezone text,
  service_id uuid,
  service_name text,
  service_description text,
  service_duration_minutes smallint,
  service_price_cents integer,
  service_currency char(3)
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    organization.name,
    location.id,
    location.name,
    location.timezone,
    service.id,
    service.name,
    service.description,
    service.duration_minutes,
    service.price_cents,
    service.currency
  from public.organizations as organization
  join public.locations as location
    on location.tenant_id = organization.id
    and location.is_active
  join public.services as service
    on service.tenant_id = organization.id
    and service.is_active
  where organization.is_booking_public
    and lower(organization.booking_slug) = lower(trim(p_booking_slug))
    and exists (
      select 1
      from public.service_resources as service_resource
      join public.resources as resource
        on resource.tenant_id = service_resource.tenant_id
        and resource.id = service_resource.resource_id
        and resource.location_id = location.id
        and resource.is_active
      where service_resource.tenant_id = organization.id
        and service_resource.service_id = service.id
    )
  order by location.name, service.name;
$$;

revoke all on function public.get_public_booking_catalog(text) from public;
grant execute on function public.get_public_booking_catalog(text) to anon;

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
  join public.organizations as organization
    on organization.id = location.tenant_id
    and organization.is_booking_public
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

revoke all on function public.list_public_available_slots(
  uuid, uuid, date, uuid, smallint
) from public;
grant execute on function public.list_public_available_slots(
  uuid, uuid, date, uuid, smallint
) to anon;
