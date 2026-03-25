-- ═══════════════════════════════════════════════════════════════════════════
-- Team Outing 2026 — Supabase Schema
-- Run this entire file in:  Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Users ─────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id           text primary key,
  email        text unique not null,
  name         text not null,
  role         text not null default 'EMPLOYEE',
  password_hash text,
  avatar       text,
  created_at   timestamptz default now()
);

-- ── RSVPs ─────────────────────────────────────────────────────────────────────
create table if not exists public.rsvps (
  id         text primary key,
  user_id    text not null references public.users(id) on delete cascade,
  attending  boolean not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- ── Polls ─────────────────────────────────────────────────────────────────────
create table if not exists public.polls (
  id         text primary key,
  question   text not null,
  is_active  boolean default true,
  created_at timestamptz default now()
);

-- ── Poll Options ──────────────────────────────────────────────────────────────
create table if not exists public.poll_options (
  id         text primary key,
  poll_id    text not null references public.polls(id) on delete cascade,
  text       text not null,
  vote_count integer default 0
);

-- ── Poll Votes (one per user per poll) ────────────────────────────────────────
create table if not exists public.poll_votes (
  id        text primary key,
  poll_id   text not null references public.polls(id) on delete cascade,
  option_id text not null references public.poll_options(id) on delete cascade,
  user_id   text not null references public.users(id) on delete cascade,
  unique(poll_id, user_id)
);

-- ── Photos ────────────────────────────────────────────────────────────────────
create table if not exists public.photos (
  id            text primary key,
  url           text not null,
  thumbnail_url text,
  caption       text,
  likes         integer default 0,
  uploader_id   text references public.users(id),
  uploaded_at   timestamptz default now()
);

-- ── Photo Likes ───────────────────────────────────────────────────────────────
create table if not exists public.photo_likes (
  photo_id text not null references public.photos(id) on delete cascade,
  user_id  text not null references public.users(id) on delete cascade,
  primary key (photo_id, user_id)
);

-- ── Messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         text primary key,
  sender_id  text references public.users(id),
  content    text not null,
  is_global  boolean default true,
  created_at timestamptz default now()
);

-- ── Feedbacks ─────────────────────────────────────────────────────────────────
create table if not exists public.feedbacks (
  id           text primary key,
  user_id      text,
  is_anonymous boolean default false,
  rating       integer not null,
  message      text not null,
  category     text not null,
  submitted_at timestamptz default now()
);

-- ── Event Config ──────────────────────────────────────────────────────────────
create table if not exists public.event_config (
  id            text primary key,
  outing_date   timestamptz,
  venue_name    text,
  venue_address text,
  description   text,
  banner_url    text
);

-- ── Activity Log ──────────────────────────────────────────────────────────────
create table if not exists public.activity_log (
  id         text primary key,
  user_id    text,
  action     text not null,
  details    text,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Disable Row-Level Security (internal team app — access controlled by
-- keeping the Supabase URL+key private within your team)
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.users         disable row level security;
alter table public.rsvps         disable row level security;
alter table public.polls         disable row level security;
alter table public.poll_options  disable row level security;
alter table public.poll_votes    disable row level security;
alter table public.photos        disable row level security;
alter table public.photo_likes   disable row level security;
alter table public.messages      disable row level security;
alter table public.feedbacks     disable row level security;
alter table public.event_config  disable row level security;
alter table public.activity_log  disable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
-- Helper functions for atomic vote counting
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function increment_vote(option_id_param text)
returns void language sql as $$
  update public.poll_options set vote_count = vote_count + 1 where id = option_id_param;
$$;

create or replace function decrement_vote(option_id_param text)
returns void language sql as $$
  update public.poll_options set vote_count = greatest(0, vote_count - 1) where id = option_id_param;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Storage bucket for photos  (public read, authenticated write)
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Allow anyone to read photos (public bucket)
create policy "Public photo read"
  on storage.objects for select
  using ( bucket_id = 'photos' );

-- Allow anyone to upload/delete photos (no backend auth in this setup)
create policy "Anyone can upload photos"
  on storage.objects for insert
  with check ( bucket_id = 'photos' );

create policy "Anyone can delete photos"
  on storage.objects for delete
  using ( bucket_id = 'photos' );
