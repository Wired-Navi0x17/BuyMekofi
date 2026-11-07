-- Milestone 3: social links, page documents (+ version history), image storage.
-- See DATABASE.md and PAGE_STUDIO.md §3.

-- ---------------------------------------------------------------------------
-- Profile links
-- ---------------------------------------------------------------------------

create type public.link_platform as enum (
  'instagram', 'youtube', 'x', 'linkedin', 'github', 'behance', 'dribbble',
  'spotify', 'twitch', 'website', 'other'
);

create table public.profile_links (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  platform   public.link_platform not null,
  url        text not null check (url ~ '^https://[^\s]{3,2040}$'),
  label      text check (char_length(label) <= 60),
  position   smallint not null check (position between 0 and 19),
  created_at timestamptz not null default now(),
  unique (creator_id, position)
);
create index profile_links_creator_idx on public.profile_links (creator_id, position);

alter table public.profile_links enable row level security;

create policy "public reads links of published profiles"
  on public.profile_links for select to anon, authenticated
  using (exists (
    select 1 from public.creator_profiles p
    where p.user_id = creator_id and p.published_at is not null and p.status = 'active'
  ));
create policy "creator reads own links"
  on public.profile_links for select to authenticated
  using (creator_id = (select auth.uid()));
create policy "creator inserts own links"
  on public.profile_links for insert to authenticated
  with check (creator_id = (select auth.uid()));
create policy "creator updates own links"
  on public.profile_links for update to authenticated
  using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
create policy "creator deletes own links"
  on public.profile_links for delete to authenticated
  using (creator_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Page documents: the Studio document (draft) and its published copy
-- ---------------------------------------------------------------------------

create table public.page_documents (
  creator_id     uuid primary key references public.creator_profiles (user_id) on delete cascade,
  schema_version smallint not null default 1,
  draft          jsonb not null,
  published      jsonb,
  published_at   timestamptz,
  updated_at     timestamptz not null default now(),
  check (pg_column_size(draft) <= 200000),
  check (published is null or pg_column_size(published) <= 200000)
);

create trigger page_documents_updated_at
  before update on public.page_documents
  for each row execute function public.set_updated_at();

alter table public.page_documents enable row level security;

create policy "public reads published documents of published profiles"
  on public.page_documents for select to anon, authenticated
  using (published is not null and exists (
    select 1 from public.creator_profiles p
    where p.user_id = creator_id and p.published_at is not null and p.status = 'active'
  ));
create policy "creator reads own document"
  on public.page_documents for select to authenticated
  using (creator_id = (select auth.uid()));
create policy "creator creates own document"
  on public.page_documents for insert to authenticated
  with check (creator_id = (select auth.uid()));
create policy "creator edits own draft"
  on public.page_documents for update to authenticated
  using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));

-- Clients edit only the draft; publishing (published, published_at) is done
-- by server code after validation, with the service role.
revoke insert, update, delete on public.page_documents from anon, authenticated;
grant insert (creator_id, schema_version, draft) on public.page_documents to authenticated;
grant update (draft, schema_version) on public.page_documents to authenticated;

create table public.page_versions (
  id             bigint generated always as identity primary key,
  creator_id     uuid not null references public.creator_profiles (user_id) on delete cascade,
  schema_version smallint not null,
  document       jsonb not null,
  published_by   uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);
create index page_versions_creator_idx on public.page_versions (creator_id, created_at desc);

create trigger page_versions_append_only
  before update or delete on public.page_versions
  for each row execute function public.forbid_update_delete();

alter table public.page_versions enable row level security;
revoke insert, update, delete on public.page_versions from anon, authenticated;
create policy "creator reads own versions"
  on public.page_versions for select to authenticated
  using (creator_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: avatars and covers. Public read; writes only into your own folder.
-- Size and type limits are enforced by the bucket and again by server code
-- (magic-byte check) before upload.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('covers',  'covers',  true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "users upload into own avatar or cover folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "users replace own avatar or cover"
  on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'covers') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('avatars', 'covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete own avatar or cover"
  on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
