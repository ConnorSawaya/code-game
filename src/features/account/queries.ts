import "server-only";

import { getViewer } from "@/features/auth/queries";
import { getSupabaseAdminClient } from "@/features/supabase/admin";

export async function getAccountPageData() {
  const viewer = await getViewer();

  if (!viewer) {
    return {
      viewer: null,
      replays: [],
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: membershipsResult } = await supabase
    .from("room_members")
    .select("id")
    .eq("profile_id", viewer.id);
  const memberships = (membershipsResult ?? []) as Array<{ id: string }>;

  const memberIds = memberships.map((membership) => membership.id);
  const { data: chainsResult } = await supabase
    .from("chains")
    .select("game_id")
    .in("origin_member_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"]);
  const chains = (chainsResult ?? []) as Array<{ game_id: string }>;

  const gameIds = [...new Set(chains.map((chain) => chain.game_id))];
  const { data: gamesResult } = await supabase
    .from("games")
    .select("id, replay_slug, completed_at, replay_storage_path, room_id")
    .in("id", gameIds.length > 0 ? gameIds : ["00000000-0000-0000-0000-000000000000"])
    .not("replay_slug", "is", null)
    .order("completed_at", { ascending: false });
  const games = (gamesResult ?? []) as Array<{
    id: string;
    replay_slug: string;
    completed_at: string | null;
    room_id: string;
  }>;

  const { data: roomsResult } = await supabase
    .from("rooms")
    .select("id, code, skill_mode")
    .in(
      "id",
      games.map((game) => game.room_id).length > 0
        ? games.map((game) => game.room_id)
        : ["00000000-0000-0000-0000-000000000000"],
    );
  const rooms = (roomsResult ?? []) as Array<{
    id: string;
    code: string;
    skill_mode: string;
  }>;

  const { data: pinsResult } = await supabase
    .from("replay_pins")
    .select("game_id")
    .eq("profile_id", viewer.id);
  const pins = (pinsResult ?? []) as Array<{ game_id: string }>;

  const roomLookup = new Map(rooms.map((room) => [room.id, room]));
  const pinSet = new Set(pins.map((pin) => pin.game_id));

  return {
    viewer,
    replays: games.map((game) => ({
      gameId: game.id,
      replaySlug: game.replay_slug,
      completedAt: game.completed_at,
      roomCode: roomLookup.get(game.room_id)?.code ?? "?????",
      skillMode: roomLookup.get(game.room_id)?.skill_mode ?? "beginner",
      pinned: pinSet.has(game.id),
    })),
  };
}
