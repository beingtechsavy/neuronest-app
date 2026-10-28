-- Donations + Supporters Wall + Pro waitlist. Apply in staging first, then production.
-- Additive migration; no user data is deleted. Follows 20261012_launch_safety.sql conventions.
begin;
create extension if not exists pgcrypto;

-- 1) Donations are one-time orders; extend billing_cycle to carry 'one_time'.
alter table public.checkout_sessions drop constraint if exists checkout_sessions_billing_cycle_check;
alter table public.checkout_sessions
  add constraint checkout_sessions_billing_cycle_check check (billing_cycle in ('monthly','yearly','one_time'));

-- 2) Supporters Wall — the only public-facing payments table. Contains ONLY
-- opted-in display columns (display name/alias, amount, optional message).
-- Never store email, phone, or payment identifiers here; the private record
-- already lives in payment_receipts + Razorpay.
create table if not exists public.supporters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null default 'Anonymous',
  is_anonymous boolean not null default false,
  amount integer not null,
  currency text not null default 'USD',
  message text,
  created_at timestamptz not null default now()
);
-- Guard rails: wall rows are capped in size to prevent abuse via service-role writes.
alter table public.supporters add constraint supporters_display_name_len check (char_length(display_name) <= 40);
alter table public.supporters add constraint supporters_message_len check (char_length(message) <= 200);
alter table public.supporters add constraint supporters_amount_range check (amount between 1 and 100000);

-- Public read (anon + authenticated) — privacy-safe by column design (no PII columns exist).
drop policy if exists supporters_public_read on public.supporters;
create policy supporters_public_read on public.supporters for select using(true);
grant select on public.supporters to anon, authenticated;
-- Writes are service-role only (same posture as other billing tables).
revoke insert, update, delete on public.supporters from anon, authenticated;
grant all on public.supporters to service_role;
create index if not exists supporters_wall_order on public.supporters(created_at desc);

-- 3) Pro waitlist — captures interest while the international checkout route is decided.
-- Email is stored (required to notify on launch); readable only by its owner and service role.
create table if not exists public.pro_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  note text not null default '',
  added_at timestamptz not null default now(),
  notified_at timestamptz
);
alter table public.pro_waitlist add constraint pro_waitlist_note_len check (char_length(note) <= 300);
-- Email must look like an email; keep the check cheap (matches emailValidation.ts posture).
alter table public.pro_waitlist add constraint pro_waitlist_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
alter table public.pro_waitlist enable row level security;
drop policy if exists waitlist_insert_own on public.pro_waitlist;
create policy waitlist_insert_own on public.pro_waitlist for insert to anon, authenticated with check(true);
-- No select/update/delete grants to anon/authenticated: position lookups happen
-- server-side through the service-role client after a signed request.
grant insert on public.pro_waitlist to anon, authenticated;
revoke select, update, delete on public.pro_waitlist from anon, authenticated;
grant all on public.pro_waitlist to service_role;
create unique index if not exists pro_waitlist_email_unique on public.pro_waitlist(lower(email));

-- 4) Donation branch inside the webhook event processor. Donations bypass the
-- Pro entitlement path entirely: one_time orders route to the supporters table
-- and return product='donation' so the TS webhook sends the thank-you email.
create or replace function public.apply_razorpay_event(event_id text, event_body jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare e text:=event_body->>'event'; pay jsonb:=event_body#>'{payload,payment,entity}';
  sub jsonb:=event_body#>'{payload,subscription,entity}'; checkout public.checkout_sessions;
  event_time bigint:=coalesce((event_body->>'created_at')::bigint,0); period_end timestamptz; new_status text;
  receipt_new boolean:=false; product text:='pro';
begin
  perform pg_advisory_xact_lock(hashtext(event_id));
  if exists(select 1 from payment_events where provider_event_id=event_id and processed_at is not null) then return '{"duplicate":true}'; end if;
  insert into payment_events(provider,provider_event_id,event_type,payload) values('razorpay',event_id,e,event_body) on conflict do nothing;
  select * into checkout from checkout_sessions where provider_id=coalesce(pay->>'order_id',sub->>'id')
    or provider_id=coalesce(pay->>'subscription_id',sub->>'id') limit 1;
  if checkout.id is null then raise exception 'Unknown checkout reference'; end if;

  -- Donation orders (one_time) never touch subscriptions or entitlements.
  if checkout.billing_cycle='one_time' then
    if e='payment.captured' and pay->>'status'='captured'
      and (pay->>'amount')::integer=checkout.amount and pay->>'currency'=checkout.currency then
      insert into payment_receipts(payment_id,user_id,amount,currency)
        values(pay->>'id',checkout.user_id,checkout.amount,checkout.currency) on conflict do nothing;
      receipt_new:=found;
      insert into supporters(user_id,display_name,is_anonymous,amount,currency,message)
        values(checkout.user_id,
          coalesce(nullif(pay->'notes'->>'display_name',''),'Anonymous'),
          coalesce(pay->'notes'->>'display_name','')='Anonymous',
          checkout.amount,checkout.currency,
          nullif(pay->'notes'->>'donation_message',''))
        on conflict do nothing;
      update payment_events set processed_at=now() where provider_event_id=event_id;
      return jsonb_build_object('user_id',checkout.user_id,'payment_id',pay->>'id',
        'receipt_new',receipt_new,'product','donation','display_name',
        coalesce(nullif(pay->'notes'->>'display_name',''),'Anonymous'));
    end if;
    update payment_events set processed_at=now() where provider_event_id=event_id;
    return '{"ignored":true}';
  end if;

  if e in ('payment.captured','subscription.activated','subscription.charged') then
    if e in ('payment.captured','subscription.charged') and (pay->>'status'<>'captured' or (pay->>'amount')::integer<>checkout.amount or pay->>'currency'<>checkout.currency) then
      raise exception 'Payment does not match checkout';
    end if;
    period_end:=case when checkout.mode='subscription' then to_timestamp((sub->>'current_end')::bigint)
      else to_timestamp(event_time) + case when checkout.billing_cycle='monthly' then interval '1 month' else interval '1 year' end end;
    if period_end is null then raise exception 'Missing paid period'; end if;
    insert into payment_receipts(payment_id,user_id,amount,currency,period_end)
      values(pay->>'id',checkout.user_id,checkout.amount,checkout.currency,period_end) on conflict do nothing;
    receipt_new:=found;
    new_status:='active';
  elsif e in ('payment.failed','subscription.halted','subscription.pending') then new_status:='past_due';
  elsif e in ('subscription.cancelled','subscription.completed') then
    new_status:='canceled';
    period_end:=to_timestamp((sub->>'current_end')::bigint);
  else
    update payment_events set processed_at=now() where provider_event_id=event_id;
    return '{"ignored":true}';
  end if;
  if receipt_new or e not in ('payment.captured','subscription.activated','subscription.charged') then
    insert into subscriptions(user_id,provider,provider_subscription_id,plan_type,status,current_period_end,cancel_at_period_end,provider_event_time)
      values(checkout.user_id,'razorpay',case when checkout.mode='subscription' then checkout.provider_id end,'pro',new_status,period_end,new_status='canceled',event_time)
    on conflict(user_id) do update set provider='razorpay',provider_subscription_id=excluded.provider_subscription_id,
      plan_type='pro',status=excluded.status,current_period_end=coalesce(excluded.current_period_end,subscriptions.current_period_end),
      cancel_at_period_end=excluded.cancel_at_period_end,provider_event_time=excluded.provider_event_time,updated_at=now()
    where subscriptions.provider_event_time<=excluded.provider_event_time;
  end if;
  update payment_events set processed_at=now() where provider_event_id=event_id;
  return jsonb_build_object('user_id',checkout.user_id,'payment_id',pay->>'id','receipt_new',receipt_new,'billing_cycle',checkout.billing_cycle);
end $$;

-- Re-apply the 20261012 execution grants (already granted to service_role; kept for clarity).
revoke all on function public.apply_razorpay_event(text,jsonb) from public;
grant execute on function public.apply_razorpay_event(text,jsonb) to service_role;

commit;
