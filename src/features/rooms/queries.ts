import "server-only";

import type {
  ChainStep,
  PublicRoomSummary,
  RoomSnapshot,
  RoomVisibility,
} from "@/features/game/types";
import {
  buildDemoPublicRoomSummaries,
  buildDemoRoomViewData,
  getDemoScenarioByCode,
} from "@/features/demo/mock-data";
import {
  getServerNicknameFallback,
  hasSupabaseServerEnv,
  isDemoModeEnabled,
} from "@/features/demo/server";
import { createSupabaseServerClient } from "@/features/supabase/server";
import { getSupabaseAdminClient } from "@/features/supabase/admin";
import { ensureReplaySnapshotStored } from "@/features/replays/snapshot";

export interface RoomViewData {
  snapshot: RoomSnapshot | null;
  reactionsByStep: Record<string, Record<string, number>>;
  favoritesByStep: Record<string, number>;
}

interface RoomRecord {
  id: string;
  code: string;
  room_name: string;
  status: RoomSnapshot["status"];
  host_profile_id: string;
  current_game_id: string | null;
  visibility: RoomSnapshot["settings"]["visibility"];
  player_cap: number;
  round_count: number;
  skill_mode: RoomSnapshot["settings"]["skillMode"];
  language_mode: RoomSnapshot["settings"]["languageMode"];
  language_pool: RoomSnapshot["settings"]["languagePool"];
  single_language: RoomSnapshot["settings"]["singleLanguage"];
  profanity_filter_enabled: boolean;
  quick_play_discoverable: boolean;
}

interface RoomMemberRecord {
  id: string;
  profile_id: string;
  nickname: string;
  role: RoomSnapshot["members"][number]["role"];
  seat_index: number | null;
  ready: boolean;
  connected: boolean;
  queued_for_next_game: boolean;
  joined_at: string;
  last_seen_at: string;
}

interface GameRecord {
  id: string;
  phase: NonNullable<RoomSnapshot["game"]>["phase"];
  round_index: number;
  total_rounds: number;
  phase_started_at: string | null;
  phase_ends_at: string | null;
  current_code_language: NonNullable<RoomSnapshot["game"]>["currentCodeLanguage"];
  replay_slug: string | null;
  replay_storage_path?: string | null;
}

interface ChainRecord {
  id: string;
  origin_member_id: string;
  origin_seat_index: number;
  prompt_source_type: "custom" | "library" | "fallback";
  prompt_record_id: string | null;
}

interface StepRecord {
  id: string;
  chain_id: string;
  round_index: number;
  step_type: ChainStep["stepType"];
  text: string;
  language: ChainStep["language"];
  fallback: boolean;
  author_member_id: string | null;
  created_at: string;
}

function sortMembers(members: RoomSnapshot["members"]) {
  return [...members].sort((left, right) => {
    const leftSeat = left.seatIndex ?? 999;
    const rightSeat = right.seatIndex ?? 999;
    return leftSeat - rightSeat || left.nickname.localeCompare(right.nickname);
  });
}

function mapSettings(room: RoomRecord): RoomSnapshot["settings"] {
  return {
    visibility: room.visibility,
    playerCap: room.player_cap,
    roundCount: room.round_count,
    skillMode: room.skill_mode,
    languageMode: room.language_mode,
    languagePool: room.language_pool,
    singleLanguage: room.single_language,
    profanityFilterEnabled: room.profanity_filter_enabled,
    quickPlayDiscoverable: room.quick_play_discoverable,
  };
}

export async function getRoomVisibilityByCode(roomCode: string) {
  if (await isDemoModeEnabled()) {
    const scenario = getDemoScenarioByCode(roomCode);

    if (scenario) {
      return {
        visibility: scenario.visibility,
        status: scenario.status,
      };
    }
  }

  if (!hasSupabaseServerEnv()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("rooms")
    .select("visibility, status")
    .eq("code", roomCode.toUpperCase())
    .maybeSingle();

  return data as { visibility: RoomVisibility; status: string } | null;
}

export async function getPublicRoomSummaries() {
  const demoMode = await isDemoModeEnabled();

  if (!hasSupabaseServerEnv()) {
    return demoMode ? buildDemoPublicRoomSummaries() : [];
  }

  const supabase = getSupabaseAdminClient();
  const { data: roomResults } = await supabase
    .from("public_room_summaries")
    .select("*")
    .order("last_activity_at", { ascending: false });
  const data = (roomResults ?? []) as Array<{
    id: string;
    code: string;
    visibility: RoomVisibility;
    status: PublicRoomSummary["status"];
    host_nickname: string;
    skill_mode: PublicRoomSummary["skillMode"];
    language_mode: PublicRoomSummary["languageMode"];
    player_count: number;
    spectator_count: number;
    seats_open: number;
    last_activity_at: string;
  }>;

  const realRooms = data.map(
    (room) =>
      ({
        id: room.id,
        code: room.code,
        visibility: room.visibility,
        status: room.status,
        hostNickname: room.host_nickname,
        skillMode: room.skill_mode,
        languageMode: room.language_mode,
        playerCount: room.player_count,
        spectatorCount: room.spectator_count,
        seatsOpen: room.seats_open,
        lastActivityAt: room.last_activity_at,
      }) satisfies PublicRoomSummary,
  );

  return demoMode ? [...buildDemoPublicRoomSummaries(), ...realRooms] : realRooms;
}

export async function getRoomViewData(roomCode: string): Promise<RoomViewData> {
  if (await isDemoModeEnabled()) {
    const nickname = await getServerNicknameFallback();
    const demoData = buildDemoRoomViewData(roomCode, nickname);

    if (demoData) {
      return demoData;
    }
  }

  if (!hasSupabaseServerEnv()) {
    return {
      snapshot: null,
      reactionsByStep: {},
      favoritesByStep: {},
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      snapshot: null,
      reactionsByStep: {},
      favoritesByStep: {},
    };
  }

  const { data: roomResult } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode.toUpperCase())
    .maybeSingle();
  const room = roomResult as RoomRecord | null;

  if (!room) {
    return {
      snapshot: null,
      reactionsByStep: {},
      favoritesByStep: {},
    };
  }

  const { data: membersResult } = await supabase
    .from("room_members")
    .select("*")
    .eq("room_id", room.id);
  const members = (membersResult ?? []) as RoomMemberRecord[];

  const currentMember = members.find(
    (member) => member.profile_id === user.id,
  );

  const snapshot: RoomSnapshot = {
    id: room.id,
    code: room.code,
    roomName: room.room_name,
    status: room.status,
    isHost: room.host_profile_id === user.id,
    viewerRole: currentMember?.role ?? null,
    currentUserMemberId: currentMember?.id ?? null,
    settings: mapSettings(room),
    members: sortMembers(
      members.map((member) => ({
        id: member.id,
        profileId: member.profile_id,
        nickname: member.nickname,
        role: member.role,
        seatIndex: member.seat_index,
        ready: member.ready,
        connected: member.connected,
        queuedForNextGame: member.queued_for_next_game,
        joinedAt: member.joined_at,
        lastSeenAt: member.last_seen_at,
        isCurrentUser: member.profile_id === user.id,
      })),
    ),
    game: null,
  };

  if (!room.current_game_id) {
    return {
      snapshot,
      reactionsByStep: {},
      favoritesByStep: {},
    };
  }

  const { data: gameResult } = await supabase
    .from("games")
    .select("*")
    .eq("id", room.current_game_id)
    .single();
  const game = gameResult as GameRecord | null;

  if (!game) {
    return {
      snapshot,
      reactionsByStep: {},
      favoritesByStep: {},
    };
  }

  const { data: chainsResult } = await supabase
    .from("chains")
    .select("*")
    .eq("game_id", game.id)
    .order("origin_seat_index", { ascending: true });
  const chains = (chainsResult ?? []) as ChainRecord[];

  const chainIds = chains.map((chain) => chain.id as string);
  const { data: stepsResult } = await supabase
    .from("chain_steps")
    .select("*")
    .in("chain_id", chainIds.length > 0 ? chainIds : ["00000000-0000-0000-0000-000000000000"])
    .order("round_index", { ascending: true });
  const steps = (stepsResult ?? []) as StepRecord[];

  const stepLookup = steps.reduce<Record<string, ChainStep[]>>(
    (accumulator, step) => {
      accumulator[step.chain_id] ??= [];
      accumulator[step.chain_id].push({
        id: step.id,
        chainId: step.chain_id,
        roundIndex: step.round_index,
        stepType: step.step_type,
        text: step.text,
        language: step.language,
        fallback: step.fallback,
        authorMemberId: step.author_member_id,
        createdAt: step.created_at,
      });
      return accumulator;
    },
    {},
  );

  const { data: reactionsResult } = await supabase
    .from("reveal_reactions")
    .select("step_id, emoji")
    .eq("game_id", game.id);
  const reactions = (reactionsResult ?? []) as Array<{ step_id: string; emoji: string }>;

  const { data: favoritesResult } = await supabase
    .from("replay_favorites")
    .select("step_id")
    .eq("game_id", game.id);
  const favorites = (favoritesResult ?? []) as Array<{ step_id: string }>;

  const reactionsByStep = reactions.reduce<
    Record<string, Record<string, number>>
  >((accumulator, reaction) => {
    accumulator[reaction.step_id] ??= {};
    accumulator[reaction.step_id][reaction.emoji] =
      (accumulator[reaction.step_id][reaction.emoji] ?? 0) + 1;
    return accumulator;
  }, {});

  const favoritesByStep = favorites.reduce<Record<string, number>>(
    (accumulator, favorite) => {
      accumulator[favorite.step_id] = (accumulator[favorite.step_id] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  snapshot.game = {
    id: game.id,
    phase: game.phase,
    roundIndex: game.round_index,
    totalRounds: game.total_rounds,
    phaseStartedAt: game.phase_started_at,
    phaseEndsAt: game.phase_ends_at,
    currentCodeLanguage: game.current_code_language,
    replaySlug: game.replay_slug,
    chains: chains.map((chain) => ({
      id: chain.id,
      originMemberId: chain.origin_member_id,
      originSeatIndex: chain.origin_seat_index,
      promptSourceType: chain.prompt_source_type,
      promptRecordId: chain.prompt_record_id,
      steps: stepLookup[chain.id] ?? [],
    })),
  };

  if (snapshot.game.phase === "reveal" && !game.replay_storage_path) {
    await ensureReplaySnapshotStored(game.id);
  }

  return {
    snapshot,
    reactionsByStep,
    favoritesByStep,
  };
}
