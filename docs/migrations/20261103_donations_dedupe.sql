-- Patch for the donations flow. Safe to re-run.
-- Context: 20261029_donations_supporters.sql is already applied in production
-- (supporters + pro_waitlist exist, checkout_sessions accepts 'one_time').
-- That file is left untouched; this patch carries only what is still missing.
begin;
create extension if not exists pgcrypto;

-- 1) New rows default to INR. Existing rows keep their recorded currency.
alter table public.supporters alter column currency set default 'INR';

-- 2) Wall ordering index (declared in 20261029 but absent from prod).
create index if not exists supporters_wall_order on public.supporters(created_at desc);

-- 2b) 20261029 created policy supporters_public_read but never enabled RLS on the
-- table, so the policy was inert and the wall was readable through the table grant.
-- Enabling RLS makes the policy the actual gate; select stays public, writes stay
-- service-role only. Idempotent.
alter table public.supporters enable row level security;

-- 3) Deduplication fix.
-- Before this, a Razorpay webhook retry that arrived before processed_at was set
-- inserted a second wall row: `supporters` has no payment_id column (privacy by
-- design) and `on conflict do nothing` had nothing to conflict on.
-- Fix: only write the wall row when the receipt itself was newly inserted.
-- payment_receipts.payment_id is the PK, so at most one delivery can win.
-- No unique index on supporters is added: two genuine same-day donations of the
-- same amount by the same person must both appear.
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
      if receipt_new then
        insert into supporters(user_id,display_name,is_anonymous,amount,currency,message)
          values(checkout.user_id,
            coalesce(nullif(pay->'notes'->>'display_name',''),'Anonymous'),
            coalesce(pay->'notes'->>'display_name','')='Anonymous',
            checkout.amount,checkout.currency,
            nullif(pay->'notes'->>'donation_message',''))
          on conflict do nothing;
      end if;
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

revoke all on function public.apply_razorpay_event(text,jsonb) from public;
grant execute on function public.apply_razorpay_event(text,jsonb) to service_role;

commit;
