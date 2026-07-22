drop function public.verify_public_booking_confirmation(text);

create function public.verify_public_booking_confirmation(p_token text)
returns public.booking_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_verification_id uuid;
  selected_contact_id uuid;
  selected_booking_id uuid;
  selected_approval_policy public.service_approval_policy;
  selected_status public.booking_status;
begin
  if p_token !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select
    verification.id,
    verification.contact_id,
    verification.booking_id,
    service.approval_policy
  into
    selected_verification_id,
    selected_contact_id,
    selected_booking_id,
    selected_approval_policy
  from public.booking_verifications as verification
  join public.bookings as booking
    on booking.tenant_id = verification.tenant_id
    and booking.id = verification.booking_id
  join public.services as service
    on service.tenant_id = booking.tenant_id
    and service.id = booking.service_id
  where verification.channel in ('email', 'whatsapp')
    and verification.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and verification.verified_at is null
    and verification.invalidated_at is null
    and verification.expires_at > now()
    and booking.status = 'pending_verification'
    and booking.verification_expires_at > now()
  for update of verification, booking, service;

  if selected_verification_id is null then
    return null;
  end if;

  selected_status := case selected_approval_policy
    when 'automatic' then 'confirmed'::public.booking_status
    when 'manual' then 'pending_approval'::public.booking_status
  end;

  update public.customer_contacts
  set verified_at = coalesce(verified_at, now())
  where id = selected_contact_id;

  update public.booking_verifications
  set verified_at = now()
  where id = selected_verification_id;

  update public.booking_verifications
  set invalidated_at = now()
  where booking_id = selected_booking_id
    and id <> selected_verification_id
    and verified_at is null
    and invalidated_at is null;

  update public.bookings
  set status = selected_status, verification_expires_at = null
  where id = selected_booking_id;

  return selected_status;
end;
$$;

revoke all on function public.verify_public_booking_confirmation(text) from public;
grant execute on function public.verify_public_booking_confirmation(text) to anon;
