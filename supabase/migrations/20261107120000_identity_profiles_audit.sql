-- Milestone 2: roles, creator profiles, reserved usernames, audit log.
-- See DATABASE.md. Every public table has RLS enabled; financial and audit
-- tables have no client policies at all.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Append-only guard for history tables (audit_logs now; payment_events,
-- ledger_entries, voucher_redemptions later).
create or replace function public.forbid_update_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = '42501';
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'support');

create table public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
comment on table public.user_roles is
  'Sole source of elevated rights. Never derive roles from user_metadata.';

alter table public.user_roles enable row level security;

-- security definer so policies can call it without granting table access;
-- empty search_path prevents object shadowing.
create or replace function public.has_role(required public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = required
  );
$$;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

create policy "admins read roles"
  on public.user_roles for select to authenticated
  using ((select public.has_role('admin')));

revoke insert, update, delete on public.user_roles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reserved usernames
-- ---------------------------------------------------------------------------

create table public.reserved_usernames (
  username extensions.citext primary key
);
alter table public.reserved_usernames enable row level security;
revoke all on public.reserved_usernames from anon, authenticated;

insert into public.reserved_usernames (username) values
  ('about'), ('account'), ('admin'), ('administrator'), ('api'), ('app'), ('auth'),
  ('billing'), ('blog'), ('callback'), ('coffea'), ('coffeaetthea'), ('contact'),
  ('dashboard'), ('dev'), ('discover'), ('docs'), ('explore'), ('faq'), ('forgot-password'),
  ('help'), ('home'), ('legal'), ('login'), ('logout'), ('me'), ('mod'), ('moderator'),
  ('new'), ('null'), ('onboarding'), ('official'), ('pay'), ('payment'), ('payments'),
  ('press'), ('pricing'), ('privacy'), ('razorpay'), ('register'), ('reset-password'),
  ('root'), ('security'), ('settings'), ('signin'), ('signup'), ('staff'), ('status'),
  ('support'), ('system'), ('terms'), ('thea'), ('undefined'), ('upi'), ('verify'),
  ('webhook'), ('webhooks'), ('www');

-- ---------------------------------------------------------------------------
-- Creator profiles
-- ---------------------------------------------------------------------------

create type public.creator_status as enum ('active', 'suspended');

create table public.creator_profiles (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  username                extensions.citext not null unique
                            check (username::text ~ '^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])$'),
  display_name            text not null check (char_length(display_name) between 1 and 60),
  bio                     text check (char_length(bio) <= 500),
  avatar_path             text check (char_length(avatar_path) <= 300),
  cover_path              text check (char_length(cover_path) <= 300),
  upi_vpa                 text check (upi_vpa ~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$'),
  show_amounts_publicly   boolean not null default false,
  published_at            timestamptz,
  onboarding_completed_at timestamptz,
  status                  public.creator_status not null default 'active',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
comment on column public.creator_profiles.published_at is
  'Public page is visible only when set and status = active. Set by server code, not clients.';

-- security definer: clients cannot read reserved_usernames directly.
create or replace function public.reject_reserved_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.reserved_usernames r where r.username = new.username) then
    raise exception 'username "%" is reserved', new.username using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger creator_profiles_reserved
  before insert or update of username on public.creator_profiles
  for each row execute function public.reject_reserved_username();

create trigger creator_profiles_updated_at
  before update on public.creator_profiles
  for each row execute function public.set_updated_at();

alter table public.creator_profiles enable row level security;

create policy "public reads published active profiles"
  on public.creator_profiles for select to anon, authenticated
  using (published_at is not null and status = 'active');

create policy "creator reads own profile"
  on public.creator_profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "admins read all profiles"
  on public.creator_profiles for select to authenticated
  using ((select public.has_role('admin')));

create policy "creator creates own profile"
  on public.creator_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "creator updates own profile"
  on public.creator_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Column-level privileges: clients may never set publication, status or
-- timestamps. Those go through server code using the service role.
revoke insert, update, delete on public.creator_profiles from anon, authenticated;
grant insert (user_id, username, display_name, bio) on public.creator_profiles to authenticated;
grant update (username, display_name, bio, avatar_path, cover_path, upi_vpa, show_amounts_publicly)
  on public.creator_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Audit log (append-only; written by server code with the service role)
-- ---------------------------------------------------------------------------

create type public.audit_actor_kind as enum ('user', 'admin', 'system', 'webhook');

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  actor_kind  public.audit_actor_kind not null,
  action      text not null check (action ~ '^[a-z_]+(\.[a-z_]+)+$'),
  entity_type text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  ip_hash     bytea,
  request_id  text,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function public.forbid_update_delete();

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create policy "admins read audit logs"
  on public.audit_logs for select to authenticated
  using ((select public.has_role('admin')));
