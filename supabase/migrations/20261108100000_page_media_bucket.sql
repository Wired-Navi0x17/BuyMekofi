-- Milestone 4: images placed inside page blocks (gallery etc.).
-- Same rules as avatars/covers: public read, owner-folder writes, server
-- checks magic bytes before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('page-media', 'page-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "users upload into own page-media folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'page-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete own page-media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'page-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
