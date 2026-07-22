create type public.resource_kind as enum (
  'person',
  'room',
  'court',
  'equipment',
  'other'
);

create type public.service_approval_policy as enum ('automatic', 'manual');

create type public.availability_exception_kind as enum ('available', 'unavailable');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  address text,
  contact_phone text,
  contact_email text,
  timezone text not null default 'America/Guatemala',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_name_length check (char_length(trim(name)) between 2 and 120),
  constraint locations_timezone_not_empty check (char_length(trim(timezone)) between 1 and 64),
  constraint locations_tenant_id_id_key unique (tenant_id, id)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  location_id uuid not null,
  name text not null,
  kind public.resource_kind not null default 'other',
  capacity integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_name_length check (char_length(trim(name)) between 2 and 120),
  constraint resources_capacity_positive check (capacity > 0),
  constraint resources_tenant_location_fkey
    foreign key (tenant_id, location_id)
    references public.locations (tenant_id, id) on delete cascade,
  constraint resources_tenant_id_id_key unique (tenant_id, id),
  constraint resources_tenant_id_id_location_id_key unique (tenant_id, id, location_id),
  constraint resources_tenant_location_name_key unique (tenant_id, location_id, name)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes smallint not null,
  buffer_before_minutes smallint not null default 0,
  buffer_after_minutes smallint not null default 0,
  price_cents integer,
  currency char(3) not null default 'GTQ',
  approval_policy public.service_approval_policy not null default 'automatic',
  allow_client_cancellation boolean not null default true,
  allow_client_rescheduling boolean not null default true,
  cancellation_notice_minutes integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_length check (char_length(trim(name)) between 2 and 120),
  constraint services_description_length check (
    description is null or char_length(trim(description)) <= 2000
  ),
  constraint services_duration_range check (duration_minutes between 1 and 1440),
  constraint services_buffer_before_range check (buffer_before_minutes between 0 and 720),
  constraint services_buffer_after_range check (buffer_after_minutes between 0 and 720),
  constraint services_price_non_negative check (price_cents is null or price_cents >= 0),
  constraint services_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint services_cancellation_notice_non_negative check (cancellation_notice_minutes >= 0),
  constraint services_tenant_id_id_key unique (tenant_id, id),
  constraint services_tenant_name_key unique (tenant_id, name)
);

create table public.service_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  service_id uuid not null,
  resource_id uuid not null,
  created_at timestamptz not null default now(),
  constraint service_resources_tenant_service_fkey
    foreign key (tenant_id, service_id)
    references public.services (tenant_id, id) on delete cascade,
  constraint service_resources_tenant_resource_fkey
    foreign key (tenant_id, resource_id)
    references public.resources (tenant_id, id) on delete cascade,
  constraint service_resources_tenant_id_id_key unique (tenant_id, id),
  constraint service_resources_service_resource_key unique (service_id, resource_id)
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  location_id uuid not null,
  resource_id uuid,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_day_of_week_range check (day_of_week between 0 and 6),
  constraint availability_rules_time_range check (start_time < end_time),
  constraint availability_rules_tenant_location_fkey
    foreign key (tenant_id, location_id)
    references public.locations (tenant_id, id) on delete cascade,
  constraint availability_rules_tenant_resource_location_fkey
    foreign key (tenant_id, resource_id, location_id)
    references public.resources (tenant_id, id, location_id) on delete cascade,
  constraint availability_rules_tenant_id_id_key unique (tenant_id, id)
);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  location_id uuid not null,
  resource_id uuid,
  kind public.availability_exception_kind not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_exceptions_time_range check (starts_at < ends_at),
  constraint availability_exceptions_note_length check (
    note is null or char_length(trim(note)) <= 500
  ),
  constraint availability_exceptions_tenant_location_fkey
    foreign key (tenant_id, location_id)
    references public.locations (tenant_id, id) on delete cascade,
  constraint availability_exceptions_tenant_resource_location_fkey
    foreign key (tenant_id, resource_id, location_id)
    references public.resources (tenant_id, id, location_id) on delete cascade,
  constraint availability_exceptions_tenant_id_id_key unique (tenant_id, id)
);

create index locations_tenant_id_is_active_idx
  on public.locations (tenant_id, is_active);

create index resources_tenant_id_location_id_is_active_idx
  on public.resources (tenant_id, location_id, is_active);

create index services_tenant_id_is_active_idx
  on public.services (tenant_id, is_active);

create index service_resources_tenant_id_service_id_idx
  on public.service_resources (tenant_id, service_id);

create index service_resources_tenant_id_resource_id_idx
  on public.service_resources (tenant_id, resource_id);

create index availability_rules_tenant_id_location_id_resource_id_idx
  on public.availability_rules (tenant_id, location_id, resource_id);

create unique index availability_rules_location_window_key
  on public.availability_rules (tenant_id, location_id, day_of_week, start_time, end_time)
  where resource_id is null;

create unique index availability_rules_resource_window_key
  on public.availability_rules (tenant_id, resource_id, day_of_week, start_time, end_time)
  where resource_id is not null;

create index availability_exceptions_tenant_id_location_id_starts_at_idx
  on public.availability_exceptions (tenant_id, location_id, starts_at, ends_at);

create index availability_exceptions_tenant_id_resource_id_starts_at_idx
  on public.availability_exceptions (tenant_id, resource_id, starts_at, ends_at)
  where resource_id is not null;

create trigger set_locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create trigger set_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger set_availability_rules_updated_at
before update on public.availability_rules
for each row execute function public.set_updated_at();

create trigger set_availability_exceptions_updated_at
before update on public.availability_exceptions
for each row execute function public.set_updated_at();

create or replace function private.audit_configuration_change()
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
    entity_id,
    before_data,
    after_data
  )
  values (
    (row_data ->> 'tenant_id')::uuid,
    (select auth.uid()),
    lower(tg_table_name) || '.' || lower(tg_op),
    tg_table_name,
    (row_data ->> 'id')::uuid,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.audit_configuration_change() from public;

create trigger audit_locations_change
after insert or update or delete on public.locations
for each row execute function private.audit_configuration_change();

create trigger audit_resources_change
after insert or update or delete on public.resources
for each row execute function private.audit_configuration_change();

create trigger audit_services_change
after insert or update or delete on public.services
for each row execute function private.audit_configuration_change();

create trigger audit_service_resources_change
after insert or update or delete on public.service_resources
for each row execute function private.audit_configuration_change();

create trigger audit_availability_rules_change
after insert or update or delete on public.availability_rules
for each row execute function private.audit_configuration_change();

create trigger audit_availability_exceptions_change
after insert or update or delete on public.availability_exceptions
for each row execute function private.audit_configuration_change();

alter table public.locations enable row level security;
alter table public.resources enable row level security;
alter table public.services enable row level security;
alter table public.service_resources enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;

revoke all on table public.locations from anon, authenticated;
revoke all on table public.resources from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.service_resources from anon, authenticated;
revoke all on table public.availability_rules from anon, authenticated;
revoke all on table public.availability_exceptions from anon, authenticated;

grant select, insert, update, delete on table public.locations to authenticated;
grant select, insert, update, delete on table public.resources to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.service_resources to authenticated;
grant select, insert, update, delete on table public.availability_rules to authenticated;
grant select, insert, update, delete on table public.availability_exceptions to authenticated;

create policy "Members can view locations"
on public.locations
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage locations"
on public.locations
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Members can view resources"
on public.resources
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage resources"
on public.resources
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Members can view services"
on public.services
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage services"
on public.services
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Members can view service resources"
on public.service_resources
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage service resources"
on public.service_resources
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Members can view availability rules"
on public.availability_rules
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage availability rules"
on public.availability_rules
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Members can view availability exceptions"
on public.availability_exceptions
for select to authenticated
using ((select private.is_organization_member(tenant_id)));

create policy "Administrators can manage availability exceptions"
on public.availability_exceptions
for all to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));
