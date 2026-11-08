-- Bug found 2026-11-08: deleting a user failed ("Database error deleting
-- user") once they had audit entries or page versions. Foreign-key actions
-- (ON DELETE SET NULL on actor_id/published_by, ON DELETE CASCADE from
-- creator_profiles) run as UPDATE/DELETE on the append-only tables, and the
-- guard rejected them. That made account erasure impossible.
--
-- Referential actions execute inside the RI trigger of the parent row, so
-- our guard sees pg_trigger_depth() > 1. Direct statements (depth 1) are
-- still rejected; history stays immutable to every client and to the
-- service role, except as a consequence of deleting the person it is about.
create or replace function public.forbid_update_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception '% is append-only', tg_table_name using errcode = '42501';
end;
$$;
