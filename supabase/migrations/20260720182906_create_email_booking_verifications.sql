create type public.booking_verification_channel as enum ('email', 'sms');

create table public.booking_verifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  booking_id uuid not null,
  contact_id uuid not null,
  channel public.booking_verification_channel not null,
  token_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint booking_verifications_token_hash_key unique (token_hash),
  constraint booking_verifications_expiry_after_creation check (expires_at > created_at),
  constraint booking_verifications_verified_after_creation check (
    verified_at is null or verified_at >= created_at
  ),
  constraint booking_verifications_tenant_booking_fkey
    foreign key (tenant_id, booking_id)
    references public.bookings (tenant_id, id) on delete cascade,
  constraint booking_verifications_tenant_contact_fkey
    foreign key (tenant_id, contact_id)
    references public.customer_contacts (tenant_id, id) on delete cascade
);

create unique index booking_verifications_active_booking_channel_key
  on public.booking_verifications (booking_id, channel)
  where verified_at is null and invalidated_at is null;

create index booking_verifications_expires_at_idx
  on public.booking_verifications (expires_at)
  where verified_at is null and invalidated_at is null;

create trigger audit_booking_verifications_change
after insert or update or delete on public.booking_verifications
for each row execute function private.audit_customer_change();

alter table public.booking_verifications enable row level security;
revoke all on table public.booking_verifications from anon, authenticated;

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
  selected_tenant_id uuid;
  selected_contact_id uuid;
  selected_recipient_email text;
  selected_expiry timestamptz;
  generated_token text;
begin
  select
    booking.tenant_id,
    contact.id,
    contact.value,
    booking.verification_expires_at,
    contact.verified_at is not null
  into
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
    verification_id := null;
    recipient_email := selected_recipient_email;
    token := null;
    expires_at := selected_expiry;
    return next;
    return;
  end if;

  update public.booking_verifications
  set invalidated_at = now()
  where booking_id = p_booking_id
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
    p_booking_id,
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
begin
  if p_token !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  select verification.id, verification.contact_id
  into selected_verification_id, selected_contact_id
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
  for update of verification;

  if selected_verification_id is null then
    return false;
  end if;

  update public.customer_contacts
  set verified_at = coalesce(verified_at, now())
  where id = selected_contact_id;

  update public.booking_verifications
  set verified_at = now()
  where id = selected_verification_id;

  return true;
end;
$$;

revoke all on function public.issue_email_booking_verification(uuid) from public;
grant execute on function public.issue_email_booking_verification(uuid) to service_role;

revoke all on function public.verify_public_booking_email(text) from public;
grant execute on function public.verify_public_booking_email(text) to anon;
