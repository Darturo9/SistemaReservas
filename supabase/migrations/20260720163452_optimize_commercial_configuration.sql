create index availability_rules_tenant_resource_location_idx
  on public.availability_rules (tenant_id, resource_id, location_id)
  where resource_id is not null;

create index availability_exceptions_tenant_resource_location_idx
  on public.availability_exceptions (tenant_id, resource_id, location_id)
  where resource_id is not null;

drop policy "Administrators can manage locations" on public.locations;
drop policy "Administrators can manage resources" on public.resources;
drop policy "Administrators can manage services" on public.services;
drop policy "Administrators can manage service resources" on public.service_resources;
drop policy "Administrators can manage availability rules" on public.availability_rules;
drop policy "Administrators can manage availability exceptions" on public.availability_exceptions;

create policy "Administrators can add locations"
on public.locations
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update locations"
on public.locations
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can remove locations"
on public.locations
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can add resources"
on public.resources
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update resources"
on public.resources
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can remove resources"
on public.resources
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can add services"
on public.services
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update services"
on public.services
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can remove services"
on public.services
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can add service resources"
on public.service_resources
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update service resources"
on public.service_resources
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can remove service resources"
on public.service_resources
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can add availability rules"
on public.availability_rules
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update availability rules"
on public.availability_rules
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can remove availability rules"
on public.availability_rules
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can add availability exceptions"
on public.availability_exceptions
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update availability exceptions"
on public.availability_exceptions
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can remove availability exceptions"
on public.availability_exceptions
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));
