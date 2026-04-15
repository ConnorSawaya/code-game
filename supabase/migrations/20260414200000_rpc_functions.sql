create or replace function public.create_room(
  p_nickname text,
  p_room_name text default 'Relay Room',
  p_visibility public.room_visibility default 'private',
  p_skill_mode public.skill_mode default 'beginner',
  p_language_mode public.language_mode default 'single',
  p_language_pool public.code_language[] default array['html_css_js', 'javascript', 'python']::public.code_language[],
  p_single_language public.code_language default 'html_css_js',
  p_round_count integer default 2,
  p_player_cap integer default 12,
  p_profanity_filter_enabled boolean default true,
  p_quick_play_discoverable boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_code text;
  room_id uuid;
  current_user uuid := auth.uid();
begin
  if current_user is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set nickname = coalesce(nullif(trim(p_nickname), ''), nickname)
  where id = current_user;

  loop
    room_code := relay.random_code(5);
    exit when not exists (
      select 1
      from public.rooms
      where code = room_code
    );
  end loop;

  insert into public.rooms (
    code,
    room_name,
    host_profile_id,
    visibility,
    status,
    skill_mode,
    language_mode,
    single_language,
    language_pool,
    player_cap,
    round_count,
    profanity_filter_enabled,
    quick_play_discoverable
  )
  values (
    room_code,
    coalesce(nullif(trim(p_room_name), ''), 'Relay Room'),
    current_user,
    p_visibility,
    'lobby',
    p_skill_mode,
    p_language_mode,
    p_single_language,
    p_language_pool,
    greatest(3, least(p_player_cap, 12)),
    greatest(2, least(p_round_count, 11)),
    p_profanity_filter_enabled,
    p_quick_play_discoverable
  )
  returning id into room_id;

  insert into public.room_members (
    room_id,
    profile_id,
    nickname,
    role,
    seat_index,
    ready
  )
  select
    room_id,
    profile.id,
    profile.nickname,
    'host',
    0,
    false
  from public.profiles profile
  where profile.id = current_user;

  perform relay.touch_room_activity(room_id);

  return jsonb_build_object(
    'room_id', room_id,
    'room_code', room_code
  );
end;
$$;

create or replace function public.check_rate_limit(
  p_action text,
  p_key_hash text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select relay.bump_rate_limit(p_action, p_key_hash, p_max_hits, p_window_seconds);
$$;

create or replace function public.join_room(
  p_room_code text,
  p_nickname text,
  p_as_spectator boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  existing_member public.room_members%rowtype;
  current_user uuid := auth.uid();
  next_seat integer;
  next_role public.member_role;
  viewer_nickname text;
begin
  if current_user is null then
    raise exception 'Authentication required';
  end if;

  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code))
  for update;

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  if exists (
    select 1
    from public.room_bans ban
    where ban.room_id = room_row.id
      and ban.profile_id = current_user
      and (ban.expires_at is null or ban.expires_at > timezone('utc', now()))
  ) then
    raise exception 'You are banned from this room';
  end if;

  update public.profiles
  set nickname = coalesce(nullif(trim(p_nickname), ''), nickname)
  where id = current_user
  returning nickname into viewer_nickname;

  select *
  into existing_member
  from public.room_members
  where room_id = room_row.id
    and profile_id = current_user
  limit 1;

  if existing_member.id is not null then
    update public.room_members
    set connected = true,
        nickname = viewer_nickname,
        last_seen_at = timezone('utc', now())
    where id = existing_member.id;

    perform relay.ensure_host(room_row.id);
    perform relay.touch_room_activity(room_row.id);

    return jsonb_build_object(
      'room_id', room_row.id,
      'room_code', room_row.code,
      'role', existing_member.role
    );
  end if;

  if room_row.status = 'live' and room_row.visibility = 'private' then
    raise exception 'Private live rooms only allow reconnects';
  end if;

  if room_row.status = 'lobby' and not p_as_spectator then
    select coalesce(max(seat_index), -1) + 1
    into next_seat
    from public.room_members
    where room_id = room_row.id
      and role in ('host', 'player');

    if next_seat < room_row.player_cap then
      next_role := 'player';
    else
      next_role := 'spectator';
      next_seat := null;
    end if;
  else
    next_role := 'spectator';
    next_seat := null;
  end if;

  insert into public.room_members (
    room_id,
    profile_id,
    nickname,
    role,
    seat_index,
    ready
  )
  values (
    room_row.id,
    current_user,
    viewer_nickname,
    next_role,
    next_seat,
    false
  );

  perform relay.ensure_host(room_row.id);
  perform relay.touch_room_activity(room_row.id);

  return jsonb_build_object(
    'room_id', room_row.id,
    'room_code', room_row.code,
    'role', next_role
  );
end;
$$;

create or replace function public.quick_play(
  p_skill_mode public.skill_mode,
  p_nickname text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row record;
  created_room jsonb;
begin
  select room.id, room.code
  into room_row
  from public.rooms room
  where room.visibility = 'public'
    and room.status = 'lobby'
    and room.quick_play_discoverable = true
    and room.skill_mode = p_skill_mode
    and (
      select count(*)
      from public.room_members member
      where member.room_id = room.id
        and member.role in ('host', 'player')
    ) < room.player_cap
  order by room.created_at asc
  limit 1;

  if room_row.id is not null then
    return public.join_room(room_row.code, p_nickname, false);
  end if;

  created_room := public.create_room(
    p_nickname,
    'Quick Play',
    'public',
    p_skill_mode,
    case when p_skill_mode = 'chaos' then 'random' else 'single' end,
    case p_skill_mode
      when 'beginner' then array['html_css_js', 'javascript', 'python']::public.code_language[]
      when 'intermediate' then array['html_css_js', 'javascript', 'python', 'typescript']::public.code_language[]
      else array['html_css_js', 'javascript', 'python', 'typescript']::public.code_language[]
    end,
    case when p_skill_mode = 'chaos' then null else 'html_css_js'::public.code_language end,
    3,
    12,
    true,
    true
  );

  return created_room;
end;
$$;

create or replace function public.heartbeat_room(
  p_room_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code));

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  perform relay.touch_member(room_row.id);
  perform relay.ensure_host(room_row.id);
  perform relay.touch_room_activity(room_row.id);

  if room_row.current_game_id is not null then
    perform relay.advance_game_internal(room_row.current_game_id, false);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.toggle_ready(
  p_room_code text,
  p_ready boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  member_row public.room_members%rowtype;
  ready_count integer;
  player_count integer;
  started_game_id uuid;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code))
  for update;

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  if room_row.status <> 'lobby' then
    raise exception 'Ready state can only be changed in the lobby';
  end if;

  select *
  into member_row
  from public.room_members
  where room_id = room_row.id
    and profile_id = auth.uid()
    and role in ('host', 'player')
  limit 1;

  if member_row.id is null then
    raise exception 'Only players can ready up';
  end if;

  update public.room_members
  set ready = coalesce(p_ready, not ready),
      last_seen_at = timezone('utc', now()),
      connected = true
  where id = member_row.id;

  select count(*)
  into ready_count
  from public.room_members
  where room_id = room_row.id
    and role in ('host', 'player')
    and ready = true;

  select count(*)
  into player_count
  from public.room_members
  where room_id = room_row.id
    and role in ('host', 'player');

  if room_row.visibility = 'public'
     and ready_count >= 4
     and player_count >= 4 then
    started_game_id := relay.begin_game(room_row.id, auth.uid(), true);
  end if;

  perform relay.ensure_host(room_row.id);
  perform relay.touch_room_activity(room_row.id);

  return jsonb_build_object(
    'ok', true,
    'started_game_id', started_game_id
  );
end;
$$;

create or replace function public.update_room_settings(
  p_room_code text,
  p_visibility public.room_visibility,
  p_skill_mode public.skill_mode,
  p_language_mode public.language_mode,
  p_language_pool public.code_language[],
  p_single_language public.code_language,
  p_round_count integer,
  p_player_cap integer,
  p_profanity_filter_enabled boolean,
  p_quick_play_discoverable boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  player_count integer;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code))
  for update;

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  perform relay.ensure_host(room_row.id);

  if room_row.host_profile_id <> auth.uid() then
    raise exception 'Only the host can change room settings';
  end if;

  if room_row.status = 'live' then
    raise exception 'Settings are locked while a game is live';
  end if;

  select count(*)
  into player_count
  from public.room_members
  where room_id = room_row.id
    and role in ('host', 'player');

  update public.rooms
  set visibility = p_visibility,
      skill_mode = p_skill_mode,
      language_mode = p_language_mode,
      language_pool = p_language_pool,
      single_language = p_single_language,
      round_count = greatest(2, least(p_round_count, greatest(player_count - 1, 2))),
      player_cap = greatest(player_count, least(p_player_cap, 12)),
      profanity_filter_enabled = p_profanity_filter_enabled,
      quick_play_discoverable = p_quick_play_discoverable,
      status = 'lobby'
  where id = room_row.id;

  perform relay.touch_room_activity(room_row.id);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.start_game(
  p_room_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  game_id uuid;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code));

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  game_id := relay.begin_game(room_row.id, auth.uid(), false);

  return jsonb_build_object(
    'ok', true,
    'game_id', game_id
  );
end;
$$;

create or replace function public.submit_round_entry(
  p_room_code text,
  p_text text,
  p_prompt_record_id text default null,
  p_prompt_source_type text default 'custom'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  game_row public.games%rowtype;
  member_row public.room_members%rowtype;
  chain_row public.chains%rowtype;
  normalized_text text;
  player_count integer;
  line_count integer;
  char_count integer;
  target_origin_seat integer;
  step_language public.code_language;
  submitted_count integer;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code))
  for update;

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  select *
  into member_row
  from public.room_members
  where room_id = room_row.id
    and profile_id = auth.uid()
    and role in ('host', 'player')
  limit 1;

  if member_row.id is null then
    raise exception 'Only active players can submit';
  end if;

  update public.room_members
  set connected = true,
      last_seen_at = timezone('utc', now())
  where id = member_row.id;

  select *
  into game_row
  from public.games
  where id = room_row.current_game_id
  for update;

  if game_row.id is null or game_row.phase not in ('prompt', 'code', 'description') then
    raise exception 'There is no active submission phase right now';
  end if;

  normalized_text := regexp_replace(replace(coalesce(p_text, ''), E'\r\n', E'\n'), E'\s+$', '', 'g');
  char_count := char_length(normalized_text);
  line_count := greatest(array_length(regexp_split_to_array(normalized_text, E'\n'), 1), 1);

  if game_row.phase = 'prompt' then
    if char_count = 0 or char_count > 180 then
      raise exception 'Prompts must be between 1 and 180 characters';
    end if;

    select *
    into chain_row
    from public.chains
    where game_id = game_row.id
      and origin_member_id = member_row.id
    limit 1;
  elsif game_row.phase = 'description' then
    if char_count = 0 or char_count > 280 or line_count > 4 then
      raise exception 'Descriptions must stay under 280 characters and 4 lines';
    end if;

    select count(*)
    into player_count
    from public.room_members
    where room_id = room_row.id
      and role in ('host', 'player');

    target_origin_seat := mod(member_row.seat_index - game_row.round_index + player_count * 8, player_count);

    select *
    into chain_row
    from public.chains
    where game_id = game_row.id
      and origin_seat_index = target_origin_seat
    limit 1;
  else
    if char_count = 0 or char_count > relay.max_chars(room_row.skill_mode) or line_count > relay.max_lines(room_row.skill_mode) then
      raise exception 'Code exceeds the room limits';
    end if;

    select count(*)
    into player_count
    from public.room_members
    where room_id = room_row.id
      and role in ('host', 'player');

    target_origin_seat := mod(member_row.seat_index - game_row.round_index + player_count * 8, player_count);

    select *
    into chain_row
    from public.chains
    where game_id = game_row.id
      and origin_seat_index = target_origin_seat
    limit 1;
  end if;

  if chain_row.id is null then
    raise exception 'Unable to resolve your assigned chain';
  end if;

  step_language := case when game_row.phase = 'code' then game_row.current_code_language else null end;

  insert into public.chain_steps (
    chain_id,
    round_index,
    step_type,
    language,
    text,
    fallback,
    prompt_record_id,
    prompt_pack,
    author_member_id
  )
  values (
    chain_row.id,
    game_row.round_index,
    relay.step_type_for_round(game_row.round_index),
    step_language,
    normalized_text,
    false,
    p_prompt_record_id,
    case when game_row.phase = 'prompt' and p_prompt_source_type = 'library' then split_part(coalesce(p_prompt_record_id, ''), '-', 1) else null end,
    member_row.id
  )
  on conflict (chain_id, round_index)
  do update set
    text = excluded.text,
    language = excluded.language,
    fallback = false,
    prompt_record_id = excluded.prompt_record_id,
    prompt_pack = excluded.prompt_pack,
    author_member_id = excluded.author_member_id;

  if game_row.phase = 'prompt' then
    update public.chains
    set prompt_source_type = p_prompt_source_type,
        prompt_record_id = p_prompt_record_id
    where id = chain_row.id;
  end if;

  select count(*)
  into submitted_count
  from public.chain_steps step
  join public.chains chain on chain.id = step.chain_id
  where chain.game_id = game_row.id
    and step.round_index = game_row.round_index;

  select count(*)
  into player_count
  from public.room_members
  where room_id = room_row.id
    and role in ('host', 'player');

  if submitted_count >= player_count then
    perform relay.advance_game_internal(game_row.id, true);
  end if;

  perform relay.touch_room_activity(room_row.id);

  return jsonb_build_object(
    'ok', true,
    'chain_id', chain_row.id
  );
end;
$$;

create or replace function public.advance_if_due(
  p_room_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  advanced boolean;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code));

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  perform relay.touch_member(room_row.id);
  perform relay.ensure_host(room_row.id);

  if room_row.current_game_id is null then
    return jsonb_build_object('ok', true, 'advanced', false);
  end if;

  advanced := relay.advance_game_internal(room_row.current_game_id, false);

  return jsonb_build_object(
    'ok', true,
    'advanced', advanced
  );
end;
$$;

create or replace function public.react_reveal_step(
  p_room_code text,
  p_step_id uuid,
  p_emoji text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  game_row public.games%rowtype;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code));

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  if not relay.is_room_member(room_row.id) then
    raise exception 'Only room members can react';
  end if;

  select *
  into game_row
  from public.games
  where id = room_row.current_game_id;

  if game_row.id is null or game_row.phase not in ('reveal', 'summary') then
    raise exception 'Reveal reactions are only available after the game';
  end if;

  insert into public.reveal_reactions (game_id, step_id, profile_id, emoji)
  values (game_row.id, p_step_id, auth.uid(), p_emoji)
  on conflict (game_id, step_id, profile_id, emoji) do nothing;

  perform relay.touch_room_activity(room_row.id);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.favorite_chain_step(
  p_room_code text,
  p_chain_id uuid,
  p_step_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  game_row public.games%rowtype;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code));

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  if not relay.is_room_member(room_row.id) then
    raise exception 'Only room members can favorite steps';
  end if;

  select *
  into game_row
  from public.games
  where id = room_row.current_game_id;

  if game_row.id is null then
    raise exception 'Replay not available';
  end if;

  insert into public.replay_favorites (game_id, chain_id, step_id, profile_id)
  values (game_row.id, p_chain_id, p_step_id, auth.uid())
  on conflict (game_id, chain_id, profile_id)
  do update set step_id = excluded.step_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.report_room(
  p_room_code text,
  p_reason text,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
begin
  select *
  into room_row
  from public.rooms
  where code = upper(trim(p_room_code));

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  insert into public.reports (
    target_type,
    room_id,
    reporter_profile_id,
    reason,
    details
  )
  values ('room', room_row.id, auth.uid(), trim(p_reason), nullif(trim(coalesce(p_details, '')), ''));

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.report_replay(
  p_replay_slug text,
  p_reason text,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  game_row public.games%rowtype;
begin
  select *
  into game_row
  from public.games
  where replay_slug = p_replay_slug;

  if game_row.id is null then
    raise exception 'Replay not found';
  end if;

  insert into public.reports (
    target_type,
    game_id,
    replay_slug,
    reporter_profile_id,
    reason,
    details
  )
  values ('replay', game_row.id, p_replay_slug, auth.uid(), trim(p_reason), nullif(trim(coalesce(p_details, '')), ''));

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.pin_replay(
  p_replay_slug text,
  p_pinned boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  game_row public.games%rowtype;
  profile_row public.profiles%rowtype;
begin
  select *
  into profile_row
  from public.profiles
  where id = auth.uid();

  if profile_row.id is null then
    raise exception 'Profile not found';
  end if;

  if profile_row.is_guest then
    raise exception 'Pinned replays are only available after email upgrade';
  end if;

  select *
  into game_row
  from public.games
  where replay_slug = p_replay_slug;

  if game_row.id is null then
    raise exception 'Replay not found';
  end if;

  if p_pinned then
    insert into public.replay_pins (game_id, profile_id)
    values (game_row.id, auth.uid())
    on conflict (game_id, profile_id) do nothing;
  else
    delete from public.replay_pins
    where game_id = game_row.id
      and profile_id = auth.uid();
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.create_room(text, text, public.room_visibility, public.skill_mode, public.language_mode, public.code_language[], public.code_language, integer, integer, boolean, boolean) to authenticated;
grant execute on function public.check_rate_limit(text, text, integer, integer) to authenticated;
grant execute on function public.join_room(text, text, boolean) to authenticated;
grant execute on function public.quick_play(public.skill_mode, text) to authenticated;
grant execute on function public.heartbeat_room(text) to authenticated;
grant execute on function public.toggle_ready(text, boolean) to authenticated;
grant execute on function public.update_room_settings(text, public.room_visibility, public.skill_mode, public.language_mode, public.code_language[], public.code_language, integer, integer, boolean, boolean) to authenticated;
grant execute on function public.start_game(text) to authenticated;
grant execute on function public.submit_round_entry(text, text, text, text) to authenticated;
grant execute on function public.advance_if_due(text) to authenticated;
grant execute on function public.react_reveal_step(text, uuid, text) to authenticated;
grant execute on function public.favorite_chain_step(text, uuid, uuid) to authenticated;
grant execute on function public.report_room(text, text, text) to authenticated;
grant execute on function public.report_replay(text, text, text) to authenticated;
grant execute on function public.pin_replay(text, boolean) to authenticated;
