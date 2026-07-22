do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public';
  end if;
end;
$$;

create type public.organization_role as enum ('owner', 'admin', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (
    full_name is null or char_length(trim(full_name)) between 2 and 120
  )
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_length check (char_length(trim(name)) between 2 and 120)
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.organization_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_organization_id_idx
  on public.organization_members (user_id, organization_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_empty check (char_length(trim(action)) > 0),
  constraint audit_logs_entity_type_not_empty check (char_length(trim(entity_type)) > 0)
);

create index audit_logs_tenant_id_created_at_idx
  on public.audit_logs (tenant_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_organization_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_organization_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  );
$$;

create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_id uuid;
  organization_name text := trim(p_name);
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if char_length(organization_name) not between 2 and 120 then
    raise exception 'Organization name must contain between 2 and 120 characters.'
      using errcode = '22023';
  end if;

  insert into public.organizations (name)
  values (organization_name)
  returning id into organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (organization_id, (select auth.uid()), 'owner');

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_data
  )
  values (
    organization_id,
    (select auth.uid()),
    'organization.created',
    'organization',
    organization_id,
    jsonb_build_object('name', organization_name)
  );

  return organization_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant select, update (full_name) on table public.profiles to authenticated;
grant select, update (name), delete on table public.organizations to authenticated;
grant select, insert (organization_id, user_id, role), update (role), delete on table public.organization_members to authenticated;
grant select on table public.audit_logs to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;
revoke all on function public.is_organization_owner(uuid) from public;
revoke all on function public.create_organization(text) from public;

grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
grant execute on function public.is_organization_owner(uuid) to authenticated;
grant execute on function public.create_organization(text) to authenticated;

create policy "Users can view their own profile"
on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Members can view their organizations"
on public.organizations
for select to authenticated
using ((select public.is_organization_member(id)));

create policy "Administrators can update organizations"
on public.organizations
for update to authenticated
using ((select public.is_organization_admin(id)))
with check ((select public.is_organization_admin(id)));

create policy "Owners can delete organizations"
on public.organizations
for delete to authenticated
using ((select public.is_organization_owner(id)));

create policy "Members can view organization members"
on public.organization_members
for select to authenticated
using ((select public.is_organization_member(organization_id)));

create policy "Owners can manage organization members"
on public.organization_members
for all to authenticated
using ((select public.is_organization_owner(organization_id)))
with check ((select public.is_organization_owner(organization_id)));

create policy "Administrators can view audit logs"
on public.audit_logs
for select to authenticated
using ((select public.is_organization_admin(tenant_id)));
