create index audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);

drop policy "Owners can manage organization members" on public.organization_members;

create policy "Owners can add organization members"
on public.organization_members
for insert to authenticated
with check ((select private.is_organization_owner(organization_id)));

create policy "Owners can update organization members"
on public.organization_members
for update to authenticated
using ((select private.is_organization_owner(organization_id)))
with check ((select private.is_organization_owner(organization_id)));

create policy "Owners can remove organization members"
on public.organization_members
for delete to authenticated
using ((select private.is_organization_owner(organization_id)));
