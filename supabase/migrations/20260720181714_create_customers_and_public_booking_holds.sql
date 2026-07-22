create type public.customer_contact_kind as enum ('email', 'phone');

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_full_name_length check (
    char_length(trim(full_name)) between 2 and 120
  ),
  constraint customers_tenant_id_id_key unique (tenant_id, id)
);

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  customer_id uuid not null,
  kind public.customer_contact_kind not null,
  value text not null,
  verified_at timestamptz,
  whatsapp_consent_at timestamptz,
  whatsapp_opted_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_contacts_value_length check (
    char_length(value) between 3 and 320
  ),
  constraint customer_contacts_value_format check (
    (kind = 'email' and value = lower(value) and value ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
    or (kind = 'phone' and value ~ '^\+[1-9][0-9]{7,14}$')
  ),
  constraint customer_contacts_whatsapp_phone_only check (
    (whatsapp_consent_at is null and whatsapp_opted_out_at is null)
    or kind = 'phone'
  ),
  constraint customer_contacts_tenant_customer_fkey
    foreign key (tenant_id, customer_id)
    references public.customers (tenant_id, id) on delete cascade,
  constraint customer_contacts_tenant_kind_value_key unique (tenant_id, kind, value),
  constraint customer_contacts_tenant_id_id_key unique (tenant_id, id)
);

alter table public.bookings
  add column customer_id uuid,
  add constraint bookings_tenant_customer_fkey
    foreign key (tenant_id, customer_id)
    references public.customers (tenant_id, id) on delete restrict;

create index bookings_tenant_id_customer_id_starts_at_idx
  on public.bookings (tenant_id, customer_id, starts_at)
  where customer_id is not null;

create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger set_customer_contacts_updated_at
before update on public.customer_contacts
for each row execute function public.set_updated_at();

create or replace function private.audit_customer_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id
  )
  values (
    (row_data ->> 'tenant_id')::uuid,
    (select auth.uid()),
    lower(tg_table_name) || '.' || lower(tg_op),
    tg_table_name,
    (row_data ->> 'id')::uuid
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.audit_customer_change() from public;

create trigger audit_customers_change
after insert or update or delete on public.customers
for each row execute function private.audit_customer_change();

create trigger audit_customer_contacts_change
after insert or update or delete on public.customer_contacts
for each row execute function private.audit_customer_change();

alter table public.customers enable row level security;
alter table public.customer_contacts enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.customer_contacts from anon, authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.customer_contacts to authenticated;

create policy "Members can view customers"
on public.customers
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage customers"
on public.customers
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Members can view customer contacts"
on public.customer_contacts
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage customer contacts"
on public.customer_contacts
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create or replace function public.create_public_booking_hold(
  p_booking_slug text,
  p_location_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_email text,
  p_phone text,
  p_whatsapp_consent boolean default false
)
returns table (
  booking_id uuid,
  verification_expires_at timestamptz
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
  booking_ends_at timestamptz;
  local_starts_at timestamp;
  local_today date;
  normalized_customer_name text := nullif(trim(p_customer_name), '');
  normalized_email text := nullif(lower(trim(p_email)), '');
  normalized_phone text := nullif(
    regexp_replace(trim(p_phone), '[[:space:].()-]', '', 'g'),
    ''
  );
  email_customer_id uuid;
  phone_customer_id uuid;
  selected_customer_id uuid;
  candidate_resource_id uuid;
  created_booking public.bookings%rowtype;
begin
  if normalized_customer_name is null
    or char_length(normalized_customer_name) not between 2 and 120 then
    raise exception 'A valid customer name is required.' using errcode = '22023';
  end if;

  if normalized_email is null
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid email address is required.' using errcode = '22023';
  end if;

  if normalized_phone is null
    or normalized_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'A valid E.164 phone number is required.' using errcode = '22023';
  end if;

  select location.tenant_id, location.timezone
  into selected_tenant_id, location_timezone
  from public.organizations as organization
  join public.locations as location
    on location.tenant_id = organization.id
    and location.is_active
  where organization.is_booking_public
    and lower(organization.booking_slug) = lower(trim(p_booking_slug))
    and location.id = p_location_id;

  if selected_tenant_id is null then
    raise exception 'The selected booking page is unavailable.' using errcode = '22023';
  end if;

  if p_starts_at < now() then
    raise exception 'The selected time is no longer available.' using errcode = '22023';
  end if;

  local_starts_at := p_starts_at at time zone location_timezone;
  local_today := now() at time zone location_timezone;

  if extract(second from local_starts_at) <> 0
    or extract(minute from local_starts_at)::integer % 15 <> 0
    or local_starts_at::date < local_today
    or local_starts_at::date > local_today + 90 then
    raise exception 'The selected time is invalid.' using errcode = '22023';
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
    raise exception 'The selected service is unavailable.' using errcode = '22023';
  end if;

  perform private.expire_pending_bookings();

  perform pg_advisory_xact_lock(
    hashtextextended(selected_tenant_id::text || ':email:' || normalized_email, 0)
  );
  perform pg_advisory_xact_lock(
    hashtextextended(selected_tenant_id::text || ':phone:' || normalized_phone, 0)
  );

  select contact.customer_id
  into email_customer_id
  from public.customer_contacts as contact
  where contact.tenant_id = selected_tenant_id
    and contact.kind = 'email'
    and contact.value = normalized_email;

  select contact.customer_id
  into phone_customer_id
  from public.customer_contacts as contact
  where contact.tenant_id = selected_tenant_id
    and contact.kind = 'phone'
    and contact.value = normalized_phone;

  if email_customer_id is not null or phone_customer_id is not null then
    if email_customer_id is null
      or phone_customer_id is null
      or email_customer_id <> phone_customer_id then
      raise exception 'The contact details could not be matched.' using errcode = '22023';
    end if;

    selected_customer_id := email_customer_id;

    if p_whatsapp_consent then
      update public.customer_contacts
      set whatsapp_consent_at = coalesce(whatsapp_consent_at, now())
      where tenant_id = selected_tenant_id
        and customer_id = selected_customer_id
        and kind = 'phone'
        and whatsapp_opted_out_at is null;
    end if;
  else
    insert into public.customers (tenant_id, full_name)
    values (selected_tenant_id, normalized_customer_name)
    returning id into selected_customer_id;

    insert into public.customer_contacts (
      tenant_id,
      customer_id,
      kind,
      value,
      whatsapp_consent_at
    )
    values
      (selected_tenant_id, selected_customer_id, 'email', normalized_email, null),
      (
        selected_tenant_id,
        selected_customer_id,
        'phone',
        normalized_phone,
        case when p_whatsapp_consent then now() end
      );
  end if;

  booking_ends_at := p_starts_at + make_interval(mins => service_duration_minutes);

  for candidate_resource_id in
    select resource.id
    from public.resources as resource
    join public.service_resources as service_resource
      on service_resource.tenant_id = resource.tenant_id
      and service_resource.resource_id = resource.id
    where resource.tenant_id = selected_tenant_id
      and resource.location_id = p_location_id
      and resource.is_active
      and service_resource.service_id = p_service_id
    order by resource.id
    for update of resource skip locked
  loop
    if private.resource_is_available_at(
      selected_tenant_id,
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
          customer_id,
          location_id,
          service_id,
          resource_id,
          status,
          starts_at,
          ends_at,
          buffer_before_minutes,
          buffer_after_minutes,
          occupied_at,
          verification_expires_at
        )
        values (
          selected_tenant_id,
          selected_customer_id,
          p_location_id,
          p_service_id,
          candidate_resource_id,
          'pending_verification',
          p_starts_at,
          booking_ends_at,
          service_buffer_before_minutes,
          service_buffer_after_minutes,
          tstzrange(
            p_starts_at - make_interval(mins => service_buffer_before_minutes),
            booking_ends_at + make_interval(mins => service_buffer_after_minutes),
            '[)'
          ),
          now() + interval '15 minutes'
        )
        returning * into created_booking;

        booking_id := created_booking.id;
        verification_expires_at := created_booking.verification_expires_at;
        return next;
        return;
      exception
        when exclusion_violation then
          -- Another transaction reserved this resource after the availability check.
          null;
      end;
    end if;
  end loop;

  raise exception 'The selected time is no longer available.' using errcode = '23P01';
end;
$$;

revoke all on function public.create_public_booking_hold(
  text, uuid, uuid, timestamptz, text, text, text, boolean
) from public;
grant execute on function public.create_public_booking_hold(
  text, uuid, uuid, timestamptz, text, text, text, boolean
) to anon;
