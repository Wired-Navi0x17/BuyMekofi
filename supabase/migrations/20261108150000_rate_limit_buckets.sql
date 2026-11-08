-- Fixed-window rate limiting in Postgres (SECURITY.md section 6).
-- Keys are HMAC hashes made by the server, so no email or IP is stored.
-- Closed to clients: RLS on with no policies, and the function is callable
-- only by the service role.
create table public.rate_limit_buckets (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 0 check (hits >= 0)
);
alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated;

-- Counts one attempt against `p_key`. Returns whether it is allowed and, when
-- it is not, how many seconds until the window resets. Every attempt counts,
-- including refused ones, so hammering does not shorten the wait.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_hits integer;
  v_start timestamptz;
begin
  if p_key is null or length(p_key) = 0 or p_window_seconds < 1 or p_max < 1 then
    raise exception 'invalid rate limit arguments';
  end if;

  insert into public.rate_limit_buckets as b (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set window_start = case when b.window_start <= now() - v_window then now() else b.window_start end,
        hits = case when b.window_start <= now() - v_window then 1 else b.hits + 1 end
  returning b.hits, b.window_start into v_hits, v_start;

  -- Housekeeping: now and then, drop buckets idle for over a day.
  if random() < 0.01 then
    delete from public.rate_limit_buckets where window_start < now() - interval '1 day';
  end if;

  allowed := v_hits <= p_max;
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (v_start + v_window - now())))::integer)
  end;
  return next;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
