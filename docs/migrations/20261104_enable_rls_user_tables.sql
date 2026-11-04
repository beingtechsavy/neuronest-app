-- Lock down the legacy user-data tables: RLS was never enabled on them, while
-- Supabase's default grants gave anon and authenticated full CRUD. The public
-- anon key therefore had read/write/delete access to every user's tasks,
-- subjects, chapters, profile, time blocks, AI breakdowns and progress.
--
-- Fail-safe: step 0 aborts the transaction if enabling RLS would make any
-- existing row unreachable. Nothing is changed if it aborts.
begin;

-- 0) Refuse to proceed if any row would become invisible.
do $$
declare n integer;
begin
  select count(*) into n from public.tasks where user_id is null;
  if n > 0 then raise exception 'abort: % tasks rows have no user_id', n; end if;

  select count(*) into n from public.subjects where user_id is null;
  if n > 0 then raise exception 'abort: % subjects rows have no user_id', n; end if;

  select count(*) into n from public.time_blocks where user_id is null;
  if n > 0 then raise exception 'abort: % time_blocks rows have no user_id', n; end if;

  select count(*) into n from public.ai_breakdowns where user_id is null;
  if n > 0 then raise exception 'abort: % ai_breakdowns rows have no user_id', n; end if;

  select count(*) into n from public.breakdown_progress where user_id is null;
  if n > 0 then raise exception 'abort: % breakdown_progress rows have no user_id', n; end if;

  select count(*) into n
    from public.chapters c
    left join public.subjects s on s.subject_id = c.subject_id
   where s.subject_id is null or s.user_id is null;
  if n > 0 then raise exception 'abort: % chapters rows have no owned subject', n; end if;
end $$;

-- 1) Columns the calendar already writes but the table is missing.
alter table public.time_blocks
  add column if not exists start_time_safe text,
  add column if not exists end_time_safe text,
  add column if not exists block_date date;

-- 2) Owner-scoped RLS. Every policy is scoped to `authenticated`, so the anon
--    role gets nothing regardless of the table grants.
alter table public.subjects           enable row level security;
alter table public.tasks              enable row level security;
alter table public.time_blocks        enable row level security;
alter table public.ai_breakdowns      enable row level security;
alter table public.breakdown_progress enable row level security;
alter table public.profiles           enable row level security;
alter table public.chapters           enable row level security;

-- subjects
drop policy if exists subjects_own on public.subjects;
create policy subjects_own on public.subjects for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks
drop policy if exists tasks_own on public.tasks;
create policy tasks_own on public.tasks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- time_blocks
drop policy if exists time_blocks_own on public.time_blocks;
create policy time_blocks_own on public.time_blocks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ai_breakdowns
drop policy if exists ai_breakdowns_own on public.ai_breakdowns;
create policy ai_breakdowns_own on public.ai_breakdowns for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- breakdown_progress
drop policy if exists breakdown_progress_own on public.breakdown_progress;
create policy breakdown_progress_own on public.breakdown_progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- profiles: the primary key IS the owner id
drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- chapters: no user_id column; ownership comes from the parent subject.
drop policy if exists chapters_own on public.chapters;
create policy chapters_own on public.chapters for all to authenticated
  using (exists (
    select 1 from public.subjects s
     where s.subject_id = chapters.subject_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.subjects s
     where s.subject_id = chapters.subject_id and s.user_id = auth.uid()
  ));

-- 3) Grants: signed-in only, and no TRUNCATE/REFERENCES/TRIGGER left behind.
revoke all on public.subjects, public.tasks, public.time_blocks,
              public.ai_breakdowns, public.breakdown_progress,
              public.profiles, public.chapters
  from anon, authenticated;

grant select, insert, update, delete on
      public.subjects, public.tasks, public.time_blocks,
      public.ai_breakdowns, public.breakdown_progress,
      public.profiles, public.chapters
  to authenticated;

-- 4) usage_limits: policy was ALL/using(true) for {public}, so any browser could
--    rewrite any quota row. Replace with owner-only access.
drop policy if exists usage_limits_policy on public.usage_limits;
drop policy if exists usage_limits_own on public.usage_limits;
create policy usage_limits_own on public.usage_limits for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) Tables nothing reads: close them off.
revoke all on public.tasks_legacy_compatible from anon, authenticated;
revoke all on public.payment_logs from anon, authenticated;
revoke all on public.webhook_logs from anon, authenticated;

commit;
