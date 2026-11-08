-- Founder request 2026-11-08: allow "-" in usernames (e.g. l41n-pr0t0).
-- To stop lookalike impersonation ("riya-draws" vs "riya_draws"), hyphen and
-- underscore are treated as the same character for uniqueness and for the
-- reserved list, and doubled separators are refused.

alter table public.creator_profiles drop constraint creator_profiles_username_check;
alter table public.creator_profiles
  add constraint creator_profiles_username_check check (
    username::text ~ '^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$'
    and username::text !~ '[-_]{2}'
  );

create unique index creator_profiles_username_canonical_idx
  on public.creator_profiles ((replace(lower(username::text), '-', '_')));

create or replace function public.reject_reserved_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.reserved_usernames r
    where replace(lower(r.username::text), '-', '_') = replace(lower(new.username::text), '-', '_')
  ) then
    raise exception 'username "%" is reserved', new.username using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.username_availability(candidate text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  u text := lower(trim(candidate));
  canon text := replace(lower(trim(candidate)), '-', '_');
begin
  if u is null or u !~ '^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$' or u ~ '[-_]{2}' then
    return 'invalid';
  end if;
  if exists (select 1 from public.reserved_usernames r where replace(lower(r.username::text), '-', '_') = canon) then
    return 'reserved';
  end if;
  if exists (select 1 from public.creator_profiles p where replace(lower(p.username::text), '-', '_') = canon) then
    return 'taken';
  end if;
  return 'available';
end;
$$;
