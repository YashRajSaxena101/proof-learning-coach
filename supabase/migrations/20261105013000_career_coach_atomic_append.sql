alter table public.career_coach_sessions add column choices jsonb not null default '{}'::jsonb;

create function public.career_coach_append(p_session uuid, p_messages jsonb, p_help boolean, p_choices jsonb)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if jsonb_typeof(p_messages) <> 'array' or jsonb_array_length(p_messages) <> 2 or jsonb_typeof(p_choices) <> 'object' then return false; end if;
  update public.career_coach_sessions
  set messages=(
        select coalesce(jsonb_agg(v order by ord),'[]'::jsonb)
        from jsonb_array_elements(career_coach_sessions.messages || p_messages) with ordinality as e(v,ord)
        where ord > greatest(jsonb_array_length(career_coach_sessions.messages || p_messages)-20,0)
      ),
      help_count=help_count+case when p_help then 1 else 0 end,
      choices=career_coach_sessions.choices || p_choices
  where id=p_session and expires_at>now();
  return found;
end $$;
revoke all on function public.career_coach_append(uuid,jsonb,boolean,jsonb) from public, anon, authenticated;
grant execute on function public.career_coach_append(uuid,jsonb,boolean,jsonb) to service_role;

create or replace function public.career_coach_reserve(p_ip text, p_session uuid default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare d date := (now() at time zone 'UTC')::date; g integer; i integer; s integer;
begin
  if p_ip is null or length(p_ip) <> 64 then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('career-coach-budget',0));
  select calls into g from public.career_coach_budgets where day=d and bucket='global';
  select calls into i from public.career_coach_budgets where day=d and bucket='ip:' || p_ip;
  if coalesce(g,0)>=200 or coalesce(i,0)>=48 then return false; end if;
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
