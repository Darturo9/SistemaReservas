alter table public.profiles
add column active_organization_id uuid
references public.organizations (id) on delete set null;

grant update (active_organization_id) on table public.profiles to authenticated;

update public.profiles as profile
set active_organization_id = membership.organization_id
from (
  select user_id, min(organization_id::text)::uuid as organization_id
  from public.organization_members
  group by user_id
  having count(*) = 1
) as membership
where profile.id = membership.user_id;

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

  update public.profiles
  set active_organization_id = organization_id
  where id = (select auth.uid());

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
