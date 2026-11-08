-- Security review 2026-11-08: RLS is row-level, so the public policy on a
-- published page_documents row also exposed its `draft` column through the
-- Data API. Drafts move to their own owner-only table; page_documents holds
-- only what is public and is written exclusively by server code.

create table public.page_drafts (
  creator_id     uuid primary key references public.creator_profiles (user_id) on delete cascade,
  schema_version smallint not null default 2,
  draft          jsonb not null check (pg_column_size(draft) <= 200000),
  updated_at     timestamptz not null default now()
);

create trigger page_drafts_updated_at
  before update on public.page_drafts
  for each row execute function public.set_updated_at();

insert into public.page_drafts (creator_id, schema_version, draft, updated_at)
  select creator_id, schema_version, draft, updated_at from public.page_documents;

alter table public.page_drafts enable row level security;
create policy "creator reads own draft"
  on public.page_drafts for select to authenticated
  using (creator_id = (select auth.uid()));
create policy "creator creates own draft"
  on public.page_drafts for insert to authenticated
  with check (creator_id = (select auth.uid()));
create policy "creator edits own draft"
  on public.page_drafts for update to authenticated
  using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
revoke all on public.page_drafts from anon;
revoke delete on public.page_drafts from authenticated;

-- page_documents: public content only, server-written.
drop policy "creator creates own document" on public.page_documents;
drop policy "creator edits own draft" on public.page_documents;
alter table public.page_documents drop column draft;
alter table public.page_documents alter column published set not null;
revoke insert, update, delete on public.page_documents from anon, authenticated;
