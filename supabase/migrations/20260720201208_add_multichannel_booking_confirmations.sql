alter table public.bookings
  add column confirmation_channel public.booking_verification_channel not null default 'email',
  add constraint bookings_confirmation_channel_supported check (
    confirmation_channel in ('email', 'whatsapp')
  );

create table public.booking_verification_deliveries (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.booking_verifications (id) on delete cascade,
  provider text not null check (provider in ('resend', 'twilio')),
  provider_message_id text,
  status text not null check (status in ('queued', 'sent', 'delivered', 'failed', 'undelivered')),
  provider_error_code text,
  fallback_started_at timestamptz,
  fallback_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_verification_deliveries_provider_message_key
    unique nulls not distinct (provider, provider_message_id)
);

create index booking_verification_deliveries_verification_id_idx
  on public.booking_verification_deliveries (verification_id);

create index booking_verification_deliveries_fallback_idx
  on public.booking_verification_deliveries (fallback_started_at)
  where fallback_sent_at is null;

create trigger set_booking_verification_deliveries_updated_at
before update on public.booking_verification_deliveries
for each row execute function public.set_updated_at();

alter table public.booking_verification_deliveries enable row level security;
revoke all on table public.booking_verification_deliveries from anon, authenticated;

create policy "Service role can manage booking verification deliveries"
on public.booking_verification_deliveries
for all to service_role
using (true)
with check (true);

create or replace function public.set_public_booking_confirmation_channel(
  p_booking_id uuid,
  p_channel public.booking_verification_channel
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_tenant_id uuid;
begin
  if p_channel not in ('email', 'whatsapp') then
    raise exception 'The confirmation channel is not supported.' using errcode = '22023';
  end if;

  select booking.tenant_id
  into selected_tenant_id
  from public.bookings as booking
  where booking.id = p_booking_id
    and booking.status = 'pending_verification'
    and booking.verification_expires_at > now()
  for update;

  if selected_tenant_id is null then
    raise exception 'The booking hold is unavailable.' using errcode = '22023';
  end if;

  if p_channel = 'whatsapp' and not exists (
    select 1
    from public.bookings as booking
    join public.customer_contacts as contact
      on contact.tenant_id = booking.tenant_id
      and contact.customer_id = booking.customer_id
      and contact.kind = 'phone'
    where booking.id = p_booking_id
      and contact.whatsapp_consent_at is not null
      and contact.whatsapp_opted_out_at is null
  ) then
    raise exception 'WhatsApp consent is required.' using errcode = '22023';
  end if;

  update public.bookings
  set confirmation_channel = p_channel
  where id = p_booking_id;
end;
$$;

create or replace function public.issue_public_booking_verification(
  p_booking_id uuid,
  p_channel public.booking_verification_channel
)
returns table (
  verification_id uuid,
  recipient text,
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_tenant_id uuid;
  selected_contact_id uuid;
  selected_recipient text;
  selected_expiry timestamptz;
  selected_contact_kind public.customer_contact_kind;
  generated_token text;
begin
  if p_channel not in ('email', 'whatsapp') then
    raise exception 'The confirmation channel is not supported.' using errcode = '22023';
  end if;

  selected_contact_kind := case
    when p_channel = 'email' then 'email'::public.customer_contact_kind
    else 'phone'::public.customer_contact_kind
  end;

  select
    booking.tenant_id,
    contact.id,
    contact.value,
    booking.verification_expires_at
  into
    selected_tenant_id,
    selected_contact_id,
    selected_recipient,
    selected_expiry
  from public.bookings as booking
  join public.customer_contacts as contact
    on contact.tenant_id = booking.tenant_id
    and contact.customer_id = booking.customer_id
    and contact.kind = selected_contact_kind
  where booking.id = p_booking_id
    and booking.status = 'pending_verification'
    and booking.verification_expires_at > now()
    and (
      p_channel <> 'whatsapp'
      or (
        contact.whatsapp_consent_at is not null
        and contact.whatsapp_opted_out_at is null
      )
    )
  for update of booking;

  if selected_tenant_id is null then
    raise exception 'The booking hold is unavailable.' using errcode = '22023';
  end if;

  update public.booking_verifications
  set invalidated_at = now()
  where booking_id = p_booking_id
    and channel = p_channel
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
    p_channel,
    encode(extensions.digest(generated_token, 'sha256'), 'hex'),
    selected_expiry
  )
  returning id into verification_id;

  recipient := selected_recipient;
  token := generated_token;
  expires_at := selected_expiry;
  return next;
end;
$$;

create or replace function public.verify_public_booking_confirmation(p_token text)
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
  where verification.channel in ('email', 'whatsapp')
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

  update public.booking_verifications
  set invalidated_at = now()
  where booking_id = selected_booking_id
    and id <> selected_verification_id
    and verified_at is null
    and invalidated_at is null;

  update public.bookings
  set status = 'pending_approval', verification_expires_at = null
  where id = selected_booking_id;

  return true;
end;
$$;

revoke all on function public.set_public_booking_confirmation_channel(
  uuid,
  public.booking_verification_channel
) from public;
grant execute on function public.set_public_booking_confirmation_channel(
  uuid,
  public.booking_verification_channel
) to service_role;

revoke all on function public.issue_public_booking_verification(
  uuid,
  public.booking_verification_channel
) from public;
grant execute on function public.issue_public_booking_verification(
  uuid,
  public.booking_verification_channel
) to service_role;

revoke all on function public.verify_public_booking_confirmation(text) from public;
grant execute on function public.verify_public_booking_confirmation(text) to anon;

revoke all on function public.issue_email_booking_verification(uuid) from service_role;
revoke all on function public.verify_public_booking_email(text) from anon;
