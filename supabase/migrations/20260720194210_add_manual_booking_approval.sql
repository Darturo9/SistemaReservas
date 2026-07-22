create or replace function public.issue_email_booking_verification(p_booking_id uuid)
returns table (
  verification_id uuid,
  recipient_email text,
  token text,
  expires_at timestamptz,
  already_verified boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_booking_id uuid;
  selected_tenant_id uuid;
  selected_contact_id uuid;
  selected_recipient_email text;
  selected_expiry timestamptz;
  generated_token text;
begin
  select
    booking.id,
    booking.tenant_id,
    contact.id,
    contact.value,
    booking.verification_expires_at,
    contact.verified_at is not null
  into
    selected_booking_id,
    selected_tenant_id,
    selected_contact_id,
    selected_recipient_email,
    selected_expiry,
    already_verified
  from public.bookings as booking
  join public.customer_contacts as contact
    on contact.tenant_id = booking.tenant_id
    and contact.customer_id = booking.customer_id
    and contact.kind = 'email'
  where booking.id = p_booking_id
    and booking.status = 'pending_verification'
    and booking.verification_expires_at > now()
  for update of booking;

  if selected_tenant_id is null then
    raise exception 'The booking hold is unavailable.' using errcode = '22023';
  end if;

  if already_verified then
    update public.bookings
    set status = 'pending_approval', verification_expires_at = null
    where id = selected_booking_id;

    verification_id := null;
    recipient_email := selected_recipient_email;
    token := null;
    expires_at := selected_expiry;
    return next;
    return;
  end if;

  update public.booking_verifications
  set invalidated_at = now()
  where booking_id = selected_booking_id
    and channel = 'email'
    and verified_at is null
    and invalidated_at is null;

  generated_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.booking_verifications (
    tenant_id,
    booking_id,
    contact_id,
    channel,
    token_hash,
    expires_at
  )
  values (
    selected_tenant_id,
    selected_booking_id,
    selected_contact_id,
    'email',
    encode(extensions.digest(generated_token, 'sha256'), 'hex'),
    selected_expiry
  )
  returning id into verification_id;

  recipient_email := selected_recipient_email;
  token := generated_token;
  expires_at := selected_expiry;
  already_verified := false;
  return next;
end;
$$;

create or replace function public.verify_public_booking_email(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_verification_id uuid;
  selected_contact_id uuid;
  selected_booking_id uuid;
begin
  if p_token !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  select verification.id, verification.contact_id, verification.booking_id
  into selected_verification_id, selected_contact_id, selected_booking_id
  from public.booking_verifications as verification
  join public.bookings as booking
    on booking.tenant_id = verification.tenant_id
    and booking.id = verification.booking_id
  where verification.channel = 'email'
    and verification.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and verification.verified_at is null
    and verification.invalidated_at is null
    and verification.expires_at > now()
    and booking.status = 'pending_verification'
    and booking.verification_expires_at > now()
  for update of verification, booking;

  if selected_verification_id is null then
    return false;
  end if;

  update public.customer_contacts
  set verified_at = coalesce(verified_at, now())
  where id = selected_contact_id;

  update public.booking_verifications
  set verified_at = now()
  where id = selected_verification_id;

  update public.bookings
  set status = 'pending_approval', verification_expires_at = null
  where id = selected_booking_id;

  return true;
end;
$$;

create or replace function public.resolve_pending_booking_approval(
  p_booking_id uuid,
  p_status public.booking_status
)
returns public.booking_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_tenant_id uuid;
  selected_status public.booking_status;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if p_status not in ('confirmed', 'cancelled') then
    raise exception 'Only confirmation or rejection is allowed.' using errcode = '22023';
  end if;

  select booking.tenant_id
  into selected_tenant_id
  from public.bookings as booking
  where booking.id = p_booking_id;

  if selected_tenant_id is null then
    raise exception 'The booking was not found.' using errcode = '22023';
  end if;

  if not (select private.is_organization_admin(selected_tenant_id)) then
    raise exception 'Organization administrator access is required.' using errcode = '42501';
  end if;

  select booking.status
  into selected_status
  from public.bookings as booking
  where booking.id = p_booking_id
  for update;

  if selected_status <> 'pending_approval' then
    raise exception 'The booking is no longer pending approval.' using errcode = '22023';
  end if;

  update public.bookings
  set status = p_status
  where id = p_booking_id;

  return p_status;
end;
$$;

revoke all on function public.resolve_pending_booking_approval(
  uuid,
  public.booking_status
) from public;

grant execute on function public.resolve_pending_booking_approval(
  uuid,
  public.booking_status
) to authenticated;

select private.expire_pending_bookings();

update public.bookings as booking
set status = 'pending_approval', verification_expires_at = null
where booking.status = 'pending_verification'
  and booking.verification_expires_at > now()
  and exists (
    select 1
    from public.booking_verifications as verification
    where verification.booking_id = booking.id
      and verification.channel = 'email'
      and verification.verified_at is not null
  );
