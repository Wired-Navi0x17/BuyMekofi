-- Image paths are set only by server code after an upload into the user's own
-- folder; clients could otherwise point their avatar at any object (another
-- user's file, or other buckets via "../"). Security review, 2026-11-08.
revoke update on public.creator_profiles from authenticated;
grant update (username, display_name, bio, upi_vpa, show_amounts_publicly)
  on public.creator_profiles to authenticated;

-- Defence in depth: the stored shape must be "<owner uuid>/<uuid>.<ext>".
update public.creator_profiles set avatar_path = null
  where avatar_path is not null
    and avatar_path !~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$');
update public.creator_profiles set cover_path = null
  where cover_path is not null
    and cover_path !~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$');

alter table public.creator_profiles
  add constraint creator_profiles_avatar_path_shape
    check (avatar_path is null or avatar_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')),
  add constraint creator_profiles_cover_path_shape
    check (cover_path is null or cover_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$'));
