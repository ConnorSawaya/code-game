create or replace function relay.random_code(code_length integer default 5)
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  output text := '';
  idx integer;
begin
  for idx in 1..code_length loop
    output := output || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;

  return output;
end;
$$;

create or replace function relay.random_slug(slug_length integer default 12)
returns text
language plpgsql
as $$
declare
  chars constant text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  output text := '';
  idx integer;
begin
  for idx in 1..slug_length loop
    output := output || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;

  return output;
end;
$$;

create or replace function relay.phase_timer_seconds(target_skill_mode public.skill_mode)
returns integer
language sql
immutable
as $$
  select case target_skill_mode
    when 'beginner' then 120
    when 'intermediate' then 90
    when 'advanced' then 75
    when 'chaos' then 60
  end;
$$;

create or replace function relay.max_lines(target_skill_mode public.skill_mode)
returns integer
language sql
immutable
as $$
  select case target_skill_mode
    when 'beginner' then 10
    when 'intermediate' then 14
    when 'advanced' then 18
    when 'chaos' then 20
  end;
$$;

create or replace function relay.max_chars(target_skill_mode public.skill_mode)
returns integer
language sql
immutable
as $$
  select case target_skill_mode
    when 'beginner' then 500
    when 'intermediate' then 700
    when 'advanced' then 1000
    when 'chaos' then 1200
  end;
$$;

create or replace function relay.step_type_for_round(target_round_index integer)
returns public.step_type
language sql
immutable
as $$
  select case
    when target_round_index = 0 then 'prompt'::public.step_type
    when mod(target_round_index, 2) = 1 then 'code'::public.step_type
    else 'description'::public.step_type
  end;
$$;

create or replace function relay.phase_for_round(target_round_index integer)
returns public.game_phase
language sql
immutable
as $$
  select case relay.step_type_for_round(target_round_index)
    when 'prompt' then 'prompt'::public.game_phase
    when 'code' then 'code'::public.game_phase
    else 'description'::public.game_phase
  end;
$$;

create or replace function relay.language_for_round(
  target_mode public.language_mode,
  target_pool public.code_language[],
  target_round_index integer,
  target_seed integer,
  target_single_language public.code_language
)
returns public.code_language
language sql
immutable
as $$
  select case
    when target_mode = 'single' then coalesce(target_single_language, target_pool[1], 'javascript'::public.code_language)
    when target_mode = 'rotate' then target_pool[((greatest(ceil(target_round_index / 2.0)::integer - 1, 0)) % greatest(array_length(target_pool, 1), 1)) + 1]
    else target_pool[((target_seed + (greatest(ceil(target_round_index / 2.0)::integer - 1, 0) * 17)) % greatest(array_length(target_pool, 1), 1)) + 1]
  end;
$$;

create or replace function relay.code_fallback_text(target_language public.code_language)
returns text
language sql
immutable
as $$
  select case target_language
    when 'python' then '# No code submitted'
    when 'html_css_js' then '<!-- No code submitted -->'
    else '// No code submitted'
  end;
$$;

create or replace function relay.touch_room_activity(target_room_id uuid)
returns void
language sql
as $$
  update public.rooms
  set last_activity_at = timezone('utc', now())
  where id = target_room_id;
$$;

create or replace function relay.touch_member(target_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  member_id uuid;
begin
  update public.room_members
  set connected = true,
      last_seen_at = timezone('utc', now())
  where room_id = target_room_id
    and profile_id = auth.uid()
  returning id into member_id;

  return member_id;
end;
$$;

create or replace function relay.ensure_host(target_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_host public.room_members%rowtype;
  replacement public.room_members%rowtype;
begin
  select *
  into current_host
  from public.room_members
  where room_id = target_room_id
    and role = 'host'
  order by joined_at asc
  limit 1;

  if current_host.id is not null
     and current_host.connected
     and current_host.last_seen_at > timezone('utc', now()) - interval '30 seconds' then
    return current_host.profile_id;
  end if;

  select *
  into replacement
  from public.room_members
  where room_id = target_room_id
    and (
      (role in ('host', 'player') and seat_index is not null)
      or role = 'spectator'
    )
    and connected = true
    and last_seen_at > timezone('utc', now()) - interval '30 seconds'
  order by case when role = 'spectator' then 1 else 0 end, seat_index asc nulls last, joined_at asc
  limit 1;

  if replacement.id is null then
    return null;
  end if;

  update public.room_members
  set role = 'player'
  where room_id = target_room_id
    and role = 'host'
    and id <> replacement.id
    and seat_index is not null;

  update public.room_members
  set role = 'host',
      ready = false
  where id = replacement.id;

  update public.rooms
  set host_profile_id = replacement.profile_id
  where id = target_room_id;

  return replacement.profile_id;
end;
$$;

create or replace function relay.bump_rate_limit(
  target_action text,
  target_key_hash text,
  max_hits integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket timestamptz;
  next_hits integer;
begin
  bucket := date_trunc(
    'second',
    timezone('utc', now()) - make_interval(secs => mod(extract(epoch from timezone('utc', now()))::integer, window_seconds))
  );

  insert into public.rate_limits (action, key_hash, bucket_start, hits)
  values (target_action, target_key_hash, bucket, 1)
  on conflict (action, key_hash, bucket_start)
  do update set hits = public.rate_limits.hits + 1
  returning hits into next_hits;

  return next_hits <= max_hits;
end;
$$;

create or replace function relay.begin_game(
  target_room_id uuid,
  requested_by uuid,
  allow_non_host boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  player_count integer;
  timer_seconds integer;
  next_game_id uuid;
  roster record;
  seed_value integer := floor(random() * 1000000)::integer;
  normalized_round_count integer;
  next_seat integer;
begin
  select *
  into room_row
  from public.rooms
  where id = target_room_id
  for update;

  if room_row.id is null then
    raise exception 'Room not found';
  end if;

  perform relay.ensure_host(target_room_id);

  select *
  into room_row
  from public.rooms
  where id = target_room_id
  for update;

  if not allow_non_host and room_row.host_profile_id <> requested_by then
    raise exception 'Only the host can start the game';
  end if;

  if room_row.status = 'live' then
    raise exception 'A game is already live in this room';
  end if;

  if room_row.status = 'reveal' then
    select coalesce(max(seat_index), -1) + 1
    into next_seat
    from public.room_members
    where room_id = target_room_id
      and role in ('host', 'player');

    for roster in
      select id
      from public.room_members
      where room_id = target_room_id
        and role = 'spectator'
        and queued_for_next_game = true
      order by joined_at asc
    loop
      exit when next_seat >= room_row.player_cap;
      update public.room_members
      set role = 'player',
          seat_index = next_seat,
          queued_for_next_game = false,
          ready = false
      where id = roster.id;
      next_seat := next_seat + 1;
    end loop;
  end if;

  select count(*)
  into player_count
  from public.room_members
  where room_id = target_room_id
    and role in ('host', 'player');

  if player_count < 3 then
    raise exception 'At least 3 players are required to start';
  end if;

  normalized_round_count := greatest(2, least(room_row.round_count, player_count - 1));
  timer_seconds := relay.phase_timer_seconds(room_row.skill_mode);

  insert into public.games (
    room_id,
    phase,
    round_index,
    total_rounds,
    language_seed,
    current_code_language,
    phase_started_at,
    phase_ends_at,
    created_by_profile_id
  )
  values (
    target_room_id,
    'prompt',
    0,
    normalized_round_count,
    seed_value,
    null,
    timezone('utc', now()),
    timezone('utc', now()) + make_interval(secs => timer_seconds),
    requested_by
  )
  returning id into next_game_id;

  insert into public.game_rounds (game_id, round_index, phase, step_type, language, started_at, ends_at)
  select
    next_game_id,
    round_index,
    relay.phase_for_round(round_index),
    relay.step_type_for_round(round_index),
    case
      when relay.step_type_for_round(round_index) = 'code'
        then relay.language_for_round(room_row.language_mode, room_row.language_pool, round_index, seed_value, room_row.single_language)
      else null
    end,
    case when round_index = 0 then timezone('utc', now()) else null end,
    case when round_index = 0 then timezone('utc', now()) + make_interval(secs => timer_seconds) else null end
  from generate_series(0, normalized_round_count) as round_index;

  insert into public.chains (game_id, origin_member_id, origin_seat_index)
  select
    next_game_id,
    member.id,
    member.seat_index
  from public.room_members member
  where member.room_id = target_room_id
    and member.role in ('host', 'player')
  order by member.seat_index asc;

  update public.rooms
  set status = 'live',
      current_game_id = next_game_id,
      last_activity_at = timezone('utc', now())
  where id = target_room_id;

  update public.room_members
  set ready = false,
      queued_for_next_game = false
  where room_id = target_room_id;

  return next_game_id;
end;
$$;

create or replace function relay.advance_game_internal(
  target_game_id uuid,
  force_ready boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  game_row public.games%rowtype;
  room_row public.rooms%rowtype;
  player_count integer;
  submitted_count integer;
  timer_seconds integer;
  next_round integer;
  next_language public.code_language;
  missing_chain record;
  assigned_author uuid;
begin
  select *
  into game_row
  from public.games
  where id = target_game_id
  for update;

  if game_row.id is null then
    return false;
  end if;

  if game_row.phase not in ('prompt', 'code', 'description') then
    return false;
  end if;

  select *
  into room_row
  from public.rooms
  where id = game_row.room_id
  for update;

  select count(*)
  into player_count
  from public.room_members
  where room_id = game_row.room_id
    and role in ('host', 'player');

  select count(*)
  into submitted_count
  from public.chain_steps step
  join public.chains chain on chain.id = step.chain_id
  where chain.game_id = game_row.id
    and step.round_index = game_row.round_index;

  if submitted_count < player_count
     and not force_ready
     and (
       game_row.phase_ends_at is null
       or timezone('utc', now()) < game_row.phase_ends_at + interval '90 seconds'
     ) then
    return false;
  end if;

  if submitted_count < player_count then
    for missing_chain in
      select chain.id, chain.origin_member_id, chain.origin_seat_index
      from public.chains chain
      left join public.chain_steps step
        on step.chain_id = chain.id
       and step.round_index = game_row.round_index
      where chain.game_id = game_row.id
        and step.id is null
      order by chain.origin_seat_index asc
    loop
      if game_row.round_index = 0 then
        assigned_author := missing_chain.origin_member_id;
      else
        select member.id
        into assigned_author
        from public.room_members member
        where member.room_id = game_row.room_id
          and member.seat_index = mod(missing_chain.origin_seat_index + game_row.round_index, player_count)
          and member.role in ('host', 'player')
        limit 1;
      end if;

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
        missing_chain.id,
        game_row.round_index,
        relay.step_type_for_round(game_row.round_index),
        case when relay.step_type_for_round(game_row.round_index) = 'code' then game_row.current_code_language else null end,
        case relay.step_type_for_round(game_row.round_index)
          when 'prompt' then 'Build a tiny web toy that surprises the user after one click.'
          when 'description' then 'No description submitted.'
          else relay.code_fallback_text(coalesce(game_row.current_code_language, 'javascript'::public.code_language))
        end,
        true,
        case when relay.step_type_for_round(game_row.round_index) = 'prompt' then 'fallback-tiny-tool' else null end,
        case when relay.step_type_for_round(game_row.round_index) = 'prompt' then 'fallbacks' else null end,
        assigned_author
      )
      on conflict (chain_id, round_index) do nothing;

      if game_row.round_index = 0 then
        update public.chains
        set prompt_source_type = 'fallback',
            prompt_record_id = 'fallback-tiny-tool'
        where id = missing_chain.id;
      end if;
    end loop;
  end if;

  update public.game_rounds
  set completed_at = timezone('utc', now())
  where game_id = game_row.id
    and round_index = game_row.round_index;

  if game_row.round_index < game_row.total_rounds then
    next_round := game_row.round_index + 1;
    timer_seconds := relay.phase_timer_seconds(room_row.skill_mode);

    select language
    into next_language
    from public.game_rounds
    where game_id = game_row.id
      and round_index = next_round;

    update public.game_rounds
    set started_at = coalesce(started_at, timezone('utc', now())),
        ends_at = timezone('utc', now()) + make_interval(secs => timer_seconds)
    where game_id = game_row.id
      and round_index = next_round;

    update public.games
    set round_index = next_round,
        phase = relay.phase_for_round(next_round),
        current_code_language = case when relay.phase_for_round(next_round) = 'code' then next_language else null end,
        phase_started_at = timezone('utc', now()),
        phase_ends_at = timezone('utc', now()) + make_interval(secs => timer_seconds)
    where id = game_row.id;
  else
    update public.games
    set phase = 'reveal',
        current_code_language = null,
        phase_started_at = timezone('utc', now()),
        phase_ends_at = null,
        completed_at = coalesce(completed_at, timezone('utc', now())),
        replay_slug = coalesce(replay_slug, relay.random_slug(12))
    where id = game_row.id;

    update public.rooms
    set status = 'reveal',
        current_game_id = game_row.id,
        last_activity_at = timezone('utc', now())
    where id = game_row.room_id;
  end if;

  perform relay.touch_room_activity(game_row.room_id);

  return true;
end;
$$;
