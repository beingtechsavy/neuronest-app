-- Fix leftover table privileges from Supabase's default grants.
--
-- Supabase applies `alter default privileges in schema public grant all on tables
-- to anon, authenticated, service_role`, so every new table starts fully
-- privileged. 20261029 revoked only insert/update/delete from anon/authenticated,
-- leaving TRUNCATE, REFERENCES and TRIGGER behind.
--
-- TRUNCATE is the one that matters: row-level security does not filter it, so
-- anyone holding the public anon key could empty the Supporters Wall.
--
-- Safe to re-run.
begin;

-- Supporters Wall: public read only.
revoke all on public.supporters from anon, authenticated;
grant select on public.supporters to anon, authenticated;

-- Pro waitlist: no client privileges at all. Writes and the position lookup both
-- go through /api/waitlist/join with the service-role client.
revoke all on public.pro_waitlist from anon, authenticated;

-- Same trap for tables added later: default to no anon/authenticated privileges
-- and require an explicit grant. Remove this line if a future feature expects
-- Supabase's automatic grants.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;

commit;
