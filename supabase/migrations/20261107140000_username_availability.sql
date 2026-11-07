-- Public username availability check for the landing-page claim box.
-- security definer so anon can learn "taken/reserved" without being able to
-- read unpublished profiles or the reserved list itself.

create or replace function public.username_availability(candidate text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  u text := lower(trim(candidate));
begin
  if u is null or u !~ '^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])$' then
    return 'invalid';
  end if;
  if exists (select 1 from public.reserved_usernames r where r.username = u::extensions.citext) then
    return 'reserved';
  end if;
  if exists (select 1 from public.creator_profiles p where p.username = u::extensions.citext) then
    return 'taken';
  end if;
  return 'available';
end;
$$;

revoke all on function public.username_availability(text) from public;
grant execute on function public.username_availability(text) to anon, authenticated;
