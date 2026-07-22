create index bookings_tenant_id_service_id_idx
  on public.bookings (tenant_id, service_id);

revoke execute on function public.list_public_available_slots(
  uuid, uuid, date, uuid, smallint
) from authenticated;
