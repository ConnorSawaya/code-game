create or replace function relay.current_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function relay.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members member
    where member.room_id = target_room_id
      and member.profile_id = auth.uid()
  );
$$;

create or replace function relay.is_room_host(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members member
    where member.room_id = target_room_id
      and member.profile_id = auth.uid()
      and member.role = 'host'
  );
$$;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.games enable row level security;
alter table public.game_rounds enable row level security;
alter table public.chains enable row level security;
alter table public.chain_steps enable row level security;
alter table public.reveal_reactions enable row level security;
alter table public.replay_favorites enable row level security;
alter table public.replay_pins enable row level security;
alter table public.reports enable row level security;
alter table public.room_bans enable row level security;
alter table public.rate_limits enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
  on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "rooms_select_members" on public.rooms;
create policy "rooms_select_members"
  on public.rooms
  for select
  using (relay.is_room_member(id));

drop policy if exists "room_members_select_members" on public.room_members;
create policy "room_members_select_members"
  on public.room_members
  for select
  using (relay.is_room_member(room_id));

drop policy if exists "games_select_room_members" on public.games;
create policy "games_select_room_members"
  on public.games
  for select
  using (relay.is_room_member(room_id));

drop policy if exists "game_rounds_select_room_members" on public.game_rounds;
create policy "game_rounds_select_room_members"
  on public.game_rounds
  for select
  using (
    exists (
      select 1
      from public.games game
      where game.id = game_rounds.game_id
        and relay.is_room_member(game.room_id)
    )
  );

drop policy if exists "chains_select_room_members" on public.chains;
create policy "chains_select_room_members"
  on public.chains
  for select
  using (
    exists (
      select 1
      from public.games game
      where game.id = chains.game_id
        and relay.is_room_member(game.room_id)
    )
  );

drop policy if exists "chain_steps_select_room_members" on public.chain_steps;
create policy "chain_steps_select_room_members"
  on public.chain_steps
  for select
  using (
    exists (
      select 1
      from public.chains chain
      join public.games game on game.id = chain.game_id
      where chain.id = chain_steps.chain_id
        and relay.is_room_member(game.room_id)
    )
  );

drop policy if exists "reveal_reactions_select_room_members" on public.reveal_reactions;
create policy "reveal_reactions_select_room_members"
  on public.reveal_reactions
  for select
  using (
    exists (
      select 1
      from public.games game
      where game.id = reveal_reactions.game_id
        and relay.is_room_member(game.room_id)
    )
  );

drop policy if exists "replay_favorites_select_room_members" on public.replay_favorites;
create policy "replay_favorites_select_room_members"
  on public.replay_favorites
  for select
  using (
    exists (
      select 1
      from public.games game
      where game.id = replay_favorites.game_id
        and relay.is_room_member(game.room_id)
    )
  );

drop policy if exists "replay_pins_select_self" on public.replay_pins;
create policy "replay_pins_select_self"
  on public.replay_pins
  for select
  using (profile_id = auth.uid());

drop policy if exists "reports_select_self" on public.reports;
create policy "reports_select_self"
  on public.reports
  for select
  using (reporter_profile_id = auth.uid());

drop policy if exists "room_bans_select_room_host_or_self" on public.room_bans;
create policy "room_bans_select_room_host_or_self"
  on public.room_bans
  for select
  using (profile_id = auth.uid() or relay.is_room_host(room_id));

drop policy if exists "rate_limits_service_only" on public.rate_limits;
create policy "rate_limits_service_only"
  on public.rate_limits
  for all
  using (false)
  with check (false);

create or replace view public.public_room_summaries
as
select
  room.id,
  room.code,
  room.visibility,
  room.status,
  room.skill_mode,
  room.language_mode,
  max(case when member.profile_id = room.host_profile_id then member.nickname end) as host_nickname,
  count(*) filter (where member.role in ('host', 'player'))::integer as player_count,
  count(*) filter (where member.role = 'spectator')::integer as spectator_count,
  greatest(room.player_cap - count(*) filter (where member.role in ('host', 'player')), 0)::integer as seats_open,
  room.last_activity_at
from public.rooms room
join public.room_members member on member.room_id = room.id
where room.visibility = 'public'
  and room.quick_play_discoverable = true
  and room.last_activity_at > timezone('utc', now()) - interval '24 hours'
  and (
    select count(*)
    from public.reports report
    where report.room_id = room.id
      and report.target_type = 'room'
      and report.created_at > timezone('utc', now()) - interval '24 hours'
  ) < 4
group by room.id;

create or replace view public.public_replay_shares
as
select
  game.id as game_id,
  game.replay_slug,
  game.replay_storage_path,
  game.completed_at,
  room.code as room_code,
  room.skill_mode,
  count(distinct reaction.id)::integer as reaction_count,
  count(distinct favorite.id)::integer as favorite_count
from public.games game
join public.rooms room on room.id = game.room_id
left join public.reveal_reactions reaction on reaction.game_id = game.id
left join public.replay_favorites favorite on favorite.game_id = game.id
where game.replay_slug is not null
group by game.id, room.code, room.skill_mode;

grant usage on schema relay to authenticated;
grant select on public.public_room_summaries to authenticated;
grant select on public.public_replay_shares to authenticated;
