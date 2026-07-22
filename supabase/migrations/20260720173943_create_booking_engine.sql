create extension if not exists btree_gist with schema extensions;

create type public.booking_status as enum (
  'pending_verification',
  'pending_approval',
  'confirmed',
  'cancelled',
  'rescheduled',
  'no_show'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  location_id uuid not null,
  service_id uuid not null,
  resource_id uuid not null,
  status public.booking_status not null default 'confirmed',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  buffer_before_minutes smallint not null default 0,
  buffer_after_minutes smallint not null default 0,
  occupied_at tstzrange not null,
  verification_expires_at timestamptz,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_service_range check (starts_at < ends_at),
  constraint bookings_buffer_before_range check (buffer_before_minutes between 0 and 720),
  constraint bookings_buffer_after_range check (buffer_after_minutes between 0 and 720),
  constraint bookings_occupied_range_matches check (
    occupied_at = tstzrange(
      starts_at - make_interval(mins => buffer_before_minutes),
      ends_at + make_interval(mins => buffer_after_minutes),
      '[)'
    )
  ),
  constraint bookings_verification_expiry check (
    (status = 'pending_verification' and verification_expires_at is not null)
    or (status <> 'pending_verification' and verification_expires_at is null)
  ),
  constraint bookings_internal_note_length check (
    internal_note is null or char_length(trim(internal_note)) <= 2000
  ),
  constraint bookings_tenant_location_fkey
    foreign key (tenant_id, location_id)
    references public.locations (tenant_id, id) on delete restrict,
  constraint bookings_tenant_service_fkey
    foreign key (tenant_id, service_id)
    references public.services (tenant_id, id) on delete restrict,
  constraint bookings_tenant_resource_fkey
    foreign key (tenant_id, resource_id)
    references public.resources (tenant_id, id) on delete restrict,
  constraint bookings_tenant_id_id_key unique (tenant_id, id),
  constraint bookings_resource_occupied_at_excl exclude using gist (
    resource_id with =,
    occupied_at with &&
  ) where (status in ('pending_verification', 'pending_approval', 'confirmed'))
);

create index bookings_tenant_id_location_id_starts_at_idx
  on public.bookings (tenant_id, location_id, starts_at);

create index bookings_tenant_id_resource_id_starts_at_idx
  on public.bookings (tenant_id, resource_id, starts_at);

create index bookings_expiring_verifications_idx
  on public.bookings (verification_expires_at)
  where status = 'pending_verification';

create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger audit_bookings_change
after insert or update or delete on public.bookings
for each row execute function private.audit_configuration_change();

alter table public.bookings enable row level security;

revoke all on table public.bookings from anon, authenticated;
grant select on table public.bookings to authenticated;

create policy "Members can view bookings"
on public.bookings
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create or replace function private.expire_pending_bookings()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.bookings
  set status = 'cancelled', verification_expires_at = null
  where status = 'pending_verification'
    and verification_expires_at <= now();
$$;

create or replace function private.resource_is_available_at(
  p_tenant_id uuid,
  p_location_id uuid,
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_buffer_before_minutes smallint,
  p_buffer_after_minutes smallint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  location_timezone text;
  occupied_range tstzrange := tstzrange(
    p_starts_at - make_interval(mins => p_buffer_before_minutes),
    p_ends_at + make_interval(mins => p_buffer_after_minutes),
    '[)'
  );
  local_occupied_start timestamp;
  local_occupied_end timestamp;
  local_day_of_week smallint;
begin
  select location.timezone
  into location_timezone
  from public.locations as location
  where location.id = p_location_id
    and location.tenant_id = p_tenant_id
    and location.is_active;

  if location_timezone is null then
    return false;
  end if;

  local_occupied_start := lower(occupied_range) at time zone location_timezone;
  local_occupied_end := upper(occupied_range) at time zone location_timezone;

  if local_occupied_start::date <> local_occupied_end::date then
    return false;
  end if;

  local_day_of_week := extract(dow from local_occupied_start)::smallint;

  if exists (
    select 1
    from public.availability_exceptions as exception
    where exception.tenant_id = p_tenant_id
      and exception.location_id = p_location_id
      and exception.kind = 'unavailable'
      and (exception.resource_id is null or exception.resource_id = p_resource_id)
      and tstzrange(exception.starts_at, exception.ends_at, '[)') && occupied_range
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.availability_exceptions as exception
    where exception.tenant_id = p_tenant_id
      and exception.location_id = p_location_id
      and exception.kind = 'available'
      and (exception.resource_id is null or exception.resource_id = p_resource_id)
      and exception.starts_at <= lower(occupied_range)
      and exception.ends_at >= upper(occupied_range)
  ) then
    return not exists (
      select 1
      from public.bookings as booking
      where booking.tenant_id = p_tenant_id
        and booking.resource_id = p_resource_id
        and booking.status in ('pending_verification', 'pending_approval', 'confirmed')
        and booking.occupied_at && occupied_range
    );
  end if;

  if exists (
    select 1
    from public.availability_rules as rule
    where rule.tenant_id = p_tenant_id
      and rule.location_id = p_location_id
      and rule.resource_id = p_resource_id
      and rule.is_active
      and rule.day_of_week = local_day_of_week
  ) then
    if not exists (
      select 1
      from public.availability_rules as rule
      where rule.tenant_id = p_tenant_id
        and rule.location_id = p_location_id
        and rule.resource_id = p_resource_id
        and rule.is_active
        and rule.day_of_week = local_day_of_week
        and rule.start_time <= local_occupied_start::time
        and rule.end_time >= local_occupied_end::time
    ) then
      return false;
    end if;
  elsif not exists (
    select 1
    from public.availability_rules as rule
    where rule.tenant_id = p_tenant_id
      and rule.location_id = p_location_id
      and rule.resource_id is null
      and rule.is_active
      and rule.day_of_week = local_day_of_week
      and rule.start_time <= local_occupied_start::time
      and rule.end_time >= local_occupied_end::time
  ) then
    return false;
  end if;

  return not exists (
    select 1
    from public.bookings as booking
    where booking.tenant_id = p_tenant_id
      and booking.resource_id = p_resource_id
      and booking.status in ('pending_verification', 'pending_approval', 'confirmed')
      and booking.occupied_at && occupied_range
  );
end;
$$;

create or replace function public.list_available_slots(
  p_tenant_id uuid,
  p_location_id uuid,
  p_service_id uuid,
  p_date date,
  p_resource_id uuid default null,
  p_interval_minutes smallint default 15
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  available_resource_count integer,
  resource_ids uuid[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  location_timezone text;
  service_duration_minutes smallint;
  service_buffer_before_minutes smallint;
  service_buffer_after_minutes smallint;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if not (select private.is_organization_member(p_tenant_id)) then
    raise exception 'Organization membership is required.' using errcode = '42501';
  end if;

  if p_interval_minutes not between 5 and 60 then
    raise exception 'The slot interval must be between 5 and 60 minutes.' using errcode = '22023';
  end if;

  perform private.expire_pending_bookings();

  select
    location.timezone,
    service.duration_minutes,
    service.buffer_before_minutes,
    service.buffer_after_minutes
  into
    location_timezone,
    service_duration_minutes,
    service_buffer_before_minutes,
    service_buffer_after_minutes
  from public.locations as location
  join public.services as service
    on service.tenant_id = location.tenant_id
  where location.tenant_id = p_tenant_id
    and location.id = p_location_id
    and location.is_active
    and service.id = p_service_id
    and service.is_active;

  if location_timezone is null then
    raise exception 'The selected active location and service are required.' using errcode = '22023';
  end if;

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
    where resource.tenant_id = p_tenant_id
      and resource.location_id = p_location_id
      and resource.is_active
      and service_resource.service_id = p_service_id
      and (p_resource_id is null or resource.id = p_resource_id)
  )
  select
    candidate_slot.candidate_starts_at,
    candidate_slot.candidate_ends_at,
    count(resource.id)::integer,
    array_agg(resource.id order by resource.id)
  from candidate_slots as candidate_slot
  cross join compatible_resources as resource
  where private.resource_is_available_at(
    p_tenant_id,
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

create or replace function public.create_booking(
  p_tenant_id uuid,
  p_location_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_resource_id uuid default null,
  p_status public.booking_status default 'confirmed',
  p_verification_expires_at timestamptz default null,
  p_internal_note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  service_duration_minutes smallint;
  service_buffer_before_minutes smallint;
  service_buffer_after_minutes smallint;
  booking_ends_at timestamptz;
  candidate_resource_id uuid;
  created_booking public.bookings%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if not (select private.is_organization_admin(p_tenant_id)) then
    raise exception 'Organization administrator access is required.' using errcode = '42501';
  end if;

  if p_status not in ('pending_verification', 'pending_approval', 'confirmed') then
    raise exception 'Only active booking states can be created.' using errcode = '22023';
  end if;

  if p_status = 'pending_verification' and (
    p_verification_expires_at is null or p_verification_expires_at <= now()
  ) then
    raise exception 'A pending verification booking requires a future expiry.'
      using errcode = '22023';
  end if;

  if p_status <> 'pending_verification' and p_verification_expires_at is not null then
    raise exception 'Only pending verification bookings may have an expiry.'
      using errcode = '22023';
  end if;

  if p_internal_note is not null and char_length(trim(p_internal_note)) > 2000 then
    raise exception 'The internal note must not exceed 2000 characters.' using errcode = '22023';
  end if;

  perform private.expire_pending_bookings();

  select
    service.duration_minutes,
    service.buffer_before_minutes,
    service.buffer_after_minutes
  into
    service_duration_minutes,
    service_buffer_before_minutes,
    service_buffer_after_minutes
  from public.services as service
  join public.locations as location
    on location.tenant_id = service.tenant_id
  where service.tenant_id = p_tenant_id
    and service.id = p_service_id
    and service.is_active
    and location.id = p_location_id
    and location.is_active;

  if service_duration_minutes is null then
    raise exception 'The selected active location and service are required.' using errcode = '22023';
  end if;

  booking_ends_at := p_starts_at + make_interval(mins => service_duration_minutes);

  for candidate_resource_id in
    select resource.id
    from public.resources as resource
    join public.service_resources as service_resource
      on service_resource.tenant_id = resource.tenant_id
      and service_resource.resource_id = resource.id
    where resource.tenant_id = p_tenant_id
      and resource.location_id = p_location_id
      and resource.is_active
      and service_resource.service_id = p_service_id
      and (p_resource_id is null or resource.id = p_resource_id)
    order by resource.id
    for update of resource skip locked
  loop
    if private.resource_is_available_at(
      p_tenant_id,
      p_location_id,
      candidate_resource_id,
      p_starts_at,
      booking_ends_at,
      service_buffer_before_minutes,
      service_buffer_after_minutes
    ) then
      begin
        insert into public.bookings (
          tenant_id,
          location_id,
          service_id,
          resource_id,
          status,
          starts_at,
          ends_at,
          buffer_before_minutes,
          buffer_after_minutes,
          occupied_at,
          verification_expires_at,
          internal_note
        )
        values (
          p_tenant_id,
          p_location_id,
          p_service_id,
          candidate_resource_id,
          p_status,
          p_starts_at,
          booking_ends_at,
          service_buffer_before_minutes,
          service_buffer_after_minutes,
          tstzrange(
            p_starts_at - make_interval(mins => service_buffer_before_minutes),
            booking_ends_at + make_interval(mins => service_buffer_after_minutes),
            '[)'
          ),
          p_verification_expires_at,
          nullif(trim(p_internal_note), '')
        )
        returning * into created_booking;

        return created_booking;
      exception
        when exclusion_violation then
          -- Another transaction reserved this resource after the availability check.
          null;
      end;
    end if;
  end loop;

  raise exception 'No compatible resource is available for this time.' using errcode = '23P01';
end;
$$;

revoke all on function private.expire_pending_bookings() from public;
revoke all on function private.resource_is_available_at(
  uuid, uuid, uuid, timestamptz, timestamptz, smallint, smallint
) from public;
revoke all on function public.list_available_slots(
  uuid, uuid, uuid, date, uuid, smallint
) from public;
revoke all on function public.create_booking(
  uuid, uuid, uuid, timestamptz, uuid, public.booking_status, timestamptz, text
) from public;

grant execute on function public.list_available_slots(
  uuid, uuid, uuid, date, uuid, smallint
) to authenticated;
grant execute on function public.create_booking(
  uuid, uuid, uuid, timestamptz, uuid, public.booking_status, timestamptz, text
) to authenticated;
