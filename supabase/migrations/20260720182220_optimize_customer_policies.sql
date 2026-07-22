create index customer_contacts_tenant_id_customer_id_idx
  on public.customer_contacts (tenant_id, customer_id);

drop policy "Administrators can manage customers" on public.customers;
drop policy "Administrators can manage customer contacts" on public.customer_contacts;

create policy "Administrators can insert customers"
on public.customers
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update customers"
on public.customers
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can delete customers"
on public.customers
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can insert customer contacts"
on public.customer_contacts
for insert to authenticated
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can update customer contacts"
on public.customer_contacts
for update to authenticated
using ((select private.is_organization_admin(tenant_id)))
with check ((select private.is_organization_admin(tenant_id)));

create policy "Administrators can delete customer contacts"
on public.customer_contacts
for delete to authenticated
using ((select private.is_organization_admin(tenant_id)));
