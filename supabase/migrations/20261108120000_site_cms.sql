-- Milestone 5: site CMS. Published content is public; drafts and history are
-- admin-only and live in separate tables (never private columns on a
-- publicly readable row; see SECURITY.md "Draft privacy").
-- All writes happen in server actions after requireAdmin(), with the service
-- role, and are audited.

create table public.site_content (
  key          text primary key check (key ~ '^[a-z]+\.[a-z_]+$'),
  value        jsonb not null check (pg_column_size(value) <= 100000),
  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id) on delete set null
);
alter table public.site_content enable row level security;
create policy "anyone reads published site content"
  on public.site_content for select to anon, authenticated using (true);
revoke insert, update, delete on public.site_content from anon, authenticated;

create table public.site_content_drafts (
  key        text primary key check (key ~ '^[a-z]+\.[a-z_]+$'),
  draft      jsonb not null check (pg_column_size(draft) <= 100000),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger site_content_drafts_updated_at
  before update on public.site_content_drafts
  for each row execute function public.set_updated_at();
alter table public.site_content_drafts enable row level security;
create policy "admins read drafts"
  on public.site_content_drafts for select to authenticated
  using ((select public.has_role('admin')));
revoke all on public.site_content_drafts from anon;
revoke insert, update, delete on public.site_content_drafts from authenticated;

create table public.site_content_versions (
  id           bigint generated always as identity primary key,
  key          text not null,
  value        jsonb not null,
  published_by uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index site_content_versions_key_idx on public.site_content_versions (key, created_at desc);
create trigger site_content_versions_append_only
  before update or delete on public.site_content_versions
  for each row execute function public.forbid_update_delete();
alter table public.site_content_versions enable row level security;
create policy "admins read content history"
  on public.site_content_versions for select to authenticated
  using ((select public.has_role('admin')));
revoke all on public.site_content_versions from anon;
revoke insert, update, delete on public.site_content_versions from authenticated;

-- Suspension reason, set by admins (service role) only.
alter table public.creator_profiles add column suspended_reason text
  check (char_length(suspended_reason) <= 300);
