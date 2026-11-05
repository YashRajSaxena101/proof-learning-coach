create table public.career_coach_sessions (
  id uuid primary key,
  capability_hash text not null,
  user_id uuid references auth.users(id),
  profile jsonb not null,
  scenario jsonb not null,
  messages jsonb not null default '[]'::jsonb,
  help_count integer not null default 0,
  calls integer not null default 1,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
alter table public.career_coach_sessions enable row level security;
revoke all on public.career_coach_sessions from public, anon, authenticated;
grant select, insert, update on public.career_coach_sessions to service_role;

create table public.career_coach_budgets (
  day date not null,
  bucket text not null,
  calls integer not null default 0,
  primary key(day, bucket)
);
alter table public.career_coach_budgets enable row level security;
revoke all on public.career_coach_budgets from public, anon, authenticated;

create function public.career_coach_reserve(p_ip text, p_session uuid default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare d date := (now() at time zone 'UTC')::date; g integer; i integer; s integer;
begin
  if p_ip is null or length(p_ip) <> 64 then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('career-coach-budget',0));
  select calls into g from public.career_coach_budgets where day=d and bucket='global';
  select calls into i from public.career_coach_budgets where day=d and bucket='ip:' || p_ip;
  if coalesce(g,0)>=200 or coalesce(i,0)>=24 then return false; end if;
  if p_session is not null then
    select calls into s from public.career_coach_sessions where id=p_session and expires_at>now() for update;
    if s is null or s>=12 then return false; end if;
    update public.career_coach_sessions set calls=calls+1 where id=p_session;
  end if;
  insert into public.career_coach_budgets(day,bucket,calls) values (d,'global',1),(d,'ip:' || p_ip,1)
  on conflict(day,bucket) do update set calls=career_coach_budgets.calls+1;
  return true;
end $$;
revoke all on function public.career_coach_reserve(text,uuid) from public, anon, authenticated;
grant execute on function public.career_coach_reserve(text,uuid) to service_role;
