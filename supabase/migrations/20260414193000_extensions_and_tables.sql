create extension if not exists pgcrypto;

create schema if not exists relay;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'room_visibility') then
    create type public.room_visibility as enum ('private', 'public');
  end if;

  if not exists (select 1 from pg_type where typname = 'room_status') then
    create type public.room_status as enum ('lobby', 'live', 'reveal');
  end if;

  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('host', 'player', 'spectator');
  end if;

  if not exists (select 1 from pg_type where typname = 'skill_mode') then
    create type public.skill_mode as enum ('beginner', 'intermediate', 'advanced', 'chaos');
  end if;

  if not exists (select 1 from pg_type where typname = 'language_mode') then
    create type public.language_mode as enum ('single', 'rotate', 'random');
  end if;

  if not exists (select 1 from pg_type where typname = 'code_language') then
    create type public.code_language as enum ('html_css_js', 'javascript', 'python', 'typescript');
  end if;

  if not exists (select 1 from pg_type where typname = 'game_phase') then
    create type public.game_phase as enum ('lobby', 'prompt', 'code', 'description', 'reveal', 'summary');
  end if;

  if not exists (select 1 from pg_type where typname = 'step_type') then
    create type public.step_type as enum ('prompt', 'code', 'description');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_target_type') then
    create type public.report_target_type as enum ('room', 'replay');
  end if;
end $$;

create or replace function relay.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function relay.default_nickname(user_id uuid)
returns text
language sql
immutable
as $$
  select 'Guest ' || upper(substr(replace(user_id::text, '-', ''), 1, 4));
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  is_guest boolean not null default true,
  email text,
  email_confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  room_name text not null default 'Relay Room',
  host_profile_id uuid not null references public.profiles(id) on delete cascade,
  visibility public.room_visibility not null default 'private',
  status public.room_status not null default 'lobby',
  skill_mode public.skill_mode not null,
  language_mode public.language_mode not null,
  single_language public.code_language,
  language_pool public.code_language[] not null,
  player_cap integer not null default 12 check (player_cap between 3 and 12),
  round_count integer not null default 2 check (round_count between 2 and 11),
  profanity_filter_enabled boolean not null default true,
  quick_play_discoverable boolean not null default false,
  current_game_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_activity_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null,
  role public.member_role not null default 'player',
  seat_index integer,
  ready boolean not null default false,
  connected boolean not null default true,
  reconnect_token text not null default encode(gen_random_bytes(12), 'hex'),
  queued_for_next_game boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (room_id, profile_id)
);

create unique index if not exists room_members_unique_seat
  on public.room_members(room_id, seat_index)
  where seat_index is not null;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  phase public.game_phase not null default 'prompt',
  round_index integer not null default 0 check (round_index >= 0),
  total_rounds integer not null check (total_rounds between 2 and 11),
  language_seed integer not null default floor(random() * 1000000)::integer,
  current_code_language public.code_language,
  phase_started_at timestamptz,
  phase_ends_at timestamptz,
  replay_slug text unique,
  replay_storage_path text,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.rooms
  add constraint rooms_current_game_fk
  foreign key (current_game_id)
  references public.games(id)
  on delete set null;

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  phase public.game_phase not null,
  step_type public.step_type not null,
  language public.code_language,
  started_at timestamptz,
  ends_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_id, round_index)
);

create table if not exists public.chains (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  origin_member_id uuid not null references public.room_members(id) on delete cascade,
  origin_seat_index integer not null,
  prompt_source_type text not null default 'custom',
  prompt_record_id text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_id, origin_member_id),
  unique (game_id, origin_seat_index)
);

create table if not exists public.chain_steps (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.chains(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  step_type public.step_type not null,
  language public.code_language,
  text text not null,
  fallback boolean not null default false,
  prompt_record_id text,
  prompt_pack text,
  author_member_id uuid references public.room_members(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (chain_id, round_index)
);

create table if not exists public.reveal_reactions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  step_id uuid not null references public.chain_steps(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_id, step_id, profile_id, emoji)
);

create table if not exists public.replay_favorites (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  chain_id uuid not null references public.chains(id) on delete cascade,
  step_id uuid not null references public.chain_steps(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_id, chain_id, profile_id)
);

create table if not exists public.replay_pins (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (game_id, profile_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.report_target_type not null,
  room_id uuid references public.rooms(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  replay_slug text,
  reporter_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.room_bans (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (room_id, profile_id)
);

create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  action text not null,
  key_hash text not null,
  bucket_start timestamptz not null,
  hits integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (action, key_hash, bucket_start)
);

create index if not exists rooms_visibility_status_idx
  on public.rooms(visibility, status, quick_play_discoverable, last_activity_at desc);

create index if not exists room_members_room_idx
  on public.room_members(room_id, role, seat_index);

create index if not exists games_room_idx
  on public.games(room_id, created_at desc);

create index if not exists chain_steps_chain_round_idx
  on public.chain_steps(chain_id, round_index);

create index if not exists reports_target_idx
  on public.reports(target_type, created_at desc);

create or replace function relay.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, is_guest, email, email_confirmed_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', relay.default_nickname(new.id)),
    coalesce(new.is_anonymous, true),
    new.email,
    new.email_confirmed_at
  )
  on conflict (id) do update
    set nickname = coalesce(new.raw_user_meta_data ->> 'nickname', public.profiles.nickname),
        is_guest = coalesce(new.is_anonymous, public.profiles.is_guest),
        email = new.email,
        email_confirmed_at = new.email_confirmed_at,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function relay.handle_auth_user();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function relay.touch_updated_at();

drop trigger if exists touch_rooms_updated_at on public.rooms;
create trigger touch_rooms_updated_at
before update on public.rooms
for each row execute function relay.touch_updated_at();

drop trigger if exists touch_room_members_updated_at on public.room_members;
create trigger touch_room_members_updated_at
before update on public.room_members
for each row execute function relay.touch_updated_at();

drop trigger if exists touch_games_updated_at on public.games;
create trigger touch_games_updated_at
before update on public.games
for each row execute function relay.touch_updated_at();

insert into storage.buckets (id, name, public)
values ('relay-replays', 'relay-replays', false)
on conflict (id) do nothing;
