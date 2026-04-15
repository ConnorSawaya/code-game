create or replace function public.toggle_next_game_queue(
  p_room_code text,
  p_queued boolean default null
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

  update public.room_members
  set queued_for_next_game = coalesce(p_queued, not queued_for_next_game),
      connected = true,
      last_seen_at = timezone('utc', now())
  where room_id = room_row.id
    and profile_id = auth.uid()
    and role = 'spectator';

  perform relay.touch_room_activity(room_row.id);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.moderate_room_member(
  p_room_code text,
  p_member_id uuid,
  p_ban boolean default false,
  p_reason text default 'Removed by host'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_row public.rooms%rowtype;
  target_member public.room_members%rowtype;
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
    raise exception 'Only the host can moderate this room';
  end if;

  select *
  into target_member
  from public.room_members
  where id = p_member_id
    and room_id = room_row.id
  for update;

  if target_member.id is null then
    raise exception 'Member not found';
  end if;

  if target_member.profile_id = auth.uid() then
    raise exception 'Hosts cannot moderate themselves';
  end if;

  if p_ban then
    insert into public.room_bans (room_id, profile_id, created_by_profile_id, reason)
    values (room_row.id, target_member.profile_id, auth.uid(), left(coalesce(trim(p_reason), 'Removed by host'), 160))
    on conflict (room_id, profile_id)
    do update set reason = excluded.reason, created_at = timezone('utc', now());
  end if;

  if room_row.status = 'live' and target_member.role in ('host', 'player') then
    update public.room_members
    set role = 'spectator',
        seat_index = null,
        ready = false,
        connected = false,
        queued_for_next_game = false,
        last_seen_at = timezone('utc', now())
    where id = target_member.id;
  else
    delete from public.room_members
    where id = target_member.id;
  end if;

  perform relay.touch_room_activity(room_row.id);

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.toggle_next_game_queue(text, boolean) to authenticated;
grant execute on function public.moderate_room_member(text, uuid, boolean, text) to authenticated;
