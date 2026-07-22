create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_organization_member(p_organization_id uuid)
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

create or replace function private.is_organization_admin(p_organization_id uuid)
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

create or replace function private.is_organization_owner(p_organization_id uuid)
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

revoke all on function private.is_organization_member(uuid) from public;
revoke all on function private.is_organization_admin(uuid) from public;
revoke all on function private.is_organization_owner(uuid) from public;

grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.is_organization_admin(uuid) to authenticated;
grant execute on function private.is_organization_owner(uuid) to authenticated;

drop policy "Members can view their organizations" on public.organizations;
drop policy "Administrators can update organizations" on public.organizations;
drop policy "Owners can delete organizations" on public.organizations;
drop policy "Members can view organization members" on public.organization_members;
drop policy "Owners can manage organization members" on public.organization_members;
drop policy "Administrators can view audit logs" on public.audit_logs;

create policy "Members can view their organizations"
on public.organizations
for select to authenticated
using ((select private.is_organization_member(id)));

create policy "Administrators can update organizations"
on public.organizations
for update to authenticated
using ((select private.is_organization_admin(id)))
with check ((select private.is_organization_admin(id)));

create policy "Owners can delete organizations"
on public.organizations
for delete to authenticated
using ((select private.is_organization_owner(id)));

create policy "Members can view organization members"
on public.organization_members
for select to authenticated
using ((select private.is_organization_member(organization_id)));

create policy "Owners can manage organization members"
on public.organization_members
for all to authenticated
using ((select private.is_organization_owner(organization_id)))
with check ((select private.is_organization_owner(organization_id)));

create policy "Administrators can view audit logs"
on public.audit_logs
for select to authenticated
using ((select private.is_organization_admin(tenant_id)));

drop function public.is_organization_member(uuid);
drop function public.is_organization_admin(uuid);
drop function public.is_organization_owner(uuid);
