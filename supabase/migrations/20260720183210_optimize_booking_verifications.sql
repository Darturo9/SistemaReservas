create index booking_verifications_tenant_id_booking_id_idx
  on public.booking_verifications (tenant_id, booking_id);

create index booking_verifications_tenant_id_contact_id_idx
  on public.booking_verifications (tenant_id, contact_id);

create policy "Service role can manage booking verifications"
on public.booking_verifications
for all to service_role
using (true)
with check (true);
