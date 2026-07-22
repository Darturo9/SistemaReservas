create type public.customer_preferred_channel as enum ('email', 'sms', 'whatsapp');

alter table public.customers
  add column preferred_contact_channel public.customer_preferred_channel not null default 'email';
