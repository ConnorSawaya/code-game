import "server-only";

import { z } from "zod";
import type { CodeLanguage, LanguageMode, RoomVisibility, SkillMode } from "@/features/game/types";
import { normalizeLanguageSettings } from "@/features/game/logic";
import { ensureReplaySnapshotStored } from "@/features/replays/snapshot";
import { createSupabaseServerClient } from "@/features/supabase/server";
import { getSupabaseAdminClient } from "@/features/supabase/admin";

const codeLanguageSchema = z.enum([
  "html_css_js",
  "javascript",
  "python",
  "typescript",
]);

function normalizeRoomLanguagePayload<T extends {
  skillMode: SkillMode;
  languageMode: LanguageMode;
  languagePool: CodeLanguage[];
  singleLanguage?: CodeLanguage | null;
}>(value: T) {
  const normalized = normalizeLanguageSettings(value);

  return {
    ...value,
    languagePool: normalized.languagePool,
    singleLanguage: normalized.singleLanguage,
  };
}

export const createRoomSchema = z.object({
  nickname: z.string().trim().min(2).max(28),
  roomName: z.string().trim().min(2).max(48).default("Relay Room"),
  visibility: z.enum(["private", "public"]),
  skillMode: z.enum(["beginner", "intermediate", "advanced", "chaos"]),
  languageMode: z.enum(["single", "rotate", "random"]),
  languagePool: z.array(codeLanguageSchema).min(1),
  singleLanguage: codeLanguageSchema.nullable().optional(),
  roundCount: z.number().int().min(2).max(11),
  playerCap: z.number().int().min(3).max(12),
  profanityFilterEnabled: z.boolean().default(true),
  quickPlayDiscoverable: z.boolean().default(false),
  turnstileToken: z.string().optional(),
  demoMode: z.boolean().optional(),
}).transform((value) => normalizeRoomLanguagePayload(value));

export const joinRoomSchema = z.object({
  roomCode: z.string().trim().min(5).max(5),
  nickname: z.string().trim().min(2).max(28),
  asSpectator: z.boolean().default(false),
  turnstileToken: z.string().optional(),
  demoMode: z.boolean().optional(),
});

export const quickPlaySchema = z.object({
  skillMode: z.enum(["beginner", "intermediate", "advanced", "chaos"]),
  nickname: z.string().trim().min(2).max(28),
  turnstileToken: z.string().optional(),
  demoMode: z.boolean().optional(),
});

export const updateRoomSettingsSchema = z.object({
  visibility: z.enum(["private", "public"]),
  skillMode: z.enum(["beginner", "intermediate", "advanced", "chaos"]),
  languageMode: z.enum(["single", "rotate", "random"]),
  languagePool: z.array(codeLanguageSchema).min(1),
  singleLanguage: codeLanguageSchema.nullable(),
  roundCount: z.number().int().min(2).max(11),
  playerCap: z.number().int().min(3).max(12),
  profanityFilterEnabled: z.boolean(),
  quickPlayDiscoverable: z.boolean(),
}).transform((value) => normalizeRoomLanguagePayload(value));

export const submitRoundSchema = z.object({
  text: z.string().max(1200),
  promptRecordId: z.string().max(80).nullable().optional(),
  promptSourceType: z.enum(["custom", "library"]).default("custom"),
});

export const reactionSchema = z.object({
  stepId: z.string().uuid(),
  emoji: z.string().trim().min(1).max(8),
});

export const favoriteSchema = z.object({
  chainId: z.string().uuid(),
  stepId: z.string().uuid(),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(4).max(120),
  details: z.string().trim().max(500).optional(),
  turnstileToken: z.string().optional(),
});

export const pinReplaySchema = z.object({
  pinned: z.boolean(),
});

export const queueSchema = z.object({
  queued: z.boolean().optional(),
});

export const moderateMemberSchema = z.object({
  memberId: z.string().uuid(),
  ban: z.boolean().default(false),
  reason: z.string().trim().max(160).optional(),
});

async function callRpc<T>(name: string, args: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(name, args);

  if (error) {
    throw error;
  }

  return data as T;
}

async function ensureReplaySnapshotForRoom(roomCode: string) {
  const supabase = getSupabaseAdminClient();
  const { data: roomResult } = await supabase
    .from("rooms")
    .select("current_game_id")
    .eq("code", roomCode.toUpperCase())
    .maybeSingle();
  const room = roomResult as { current_game_id: string | null } | null;

  if (!room?.current_game_id) {
    return;
  }

  const { data: gameResult } = await supabase
    .from("games")
    .select("id, phase, replay_storage_path")
    .eq("id", room.current_game_id)
    .single();
  const game = gameResult as
    | { id: string; phase: string; replay_storage_path: string | null }
    | null;

  if (game?.phase === "reveal" && !game.replay_storage_path) {
    await ensureReplaySnapshotStored(game.id);
  }
}

export async function createRoom(payload: z.infer<typeof createRoomSchema>) {
  return callRpc<{ room_code: string }>("create_room", {
    p_nickname: payload.nickname,
    p_room_name: payload.roomName,
    p_visibility: payload.visibility as RoomVisibility,
    p_skill_mode: payload.skillMode as SkillMode,
    p_language_mode: payload.languageMode as LanguageMode,
    p_language_pool: payload.languagePool as CodeLanguage[],
    p_single_language: payload.singleLanguage ?? null,
    p_round_count: payload.roundCount,
    p_player_cap: payload.playerCap,
    p_profanity_filter_enabled: payload.profanityFilterEnabled,
    p_quick_play_discoverable: payload.quickPlayDiscoverable,
  });
}

export async function joinRoom(payload: z.infer<typeof joinRoomSchema>) {
  return callRpc<{ room_code: string }>("join_room", {
    p_room_code: payload.roomCode.toUpperCase(),
    p_nickname: payload.nickname,
    p_as_spectator: payload.asSpectator,
  });
}

export async function quickPlay(payload: z.infer<typeof quickPlaySchema>) {
  return callRpc<{ room_code: string }>("quick_play", {
    p_skill_mode: payload.skillMode,
    p_nickname: payload.nickname,
  });
}

export async function toggleReady(roomCode: string, ready?: boolean) {
  return callRpc("toggle_ready", {
    p_room_code: roomCode.toUpperCase(),
    p_ready: ready ?? null,
  });
}

export async function updateRoomSettings(
  roomCode: string,
  payload: z.infer<typeof updateRoomSettingsSchema>,
) {
  return callRpc("update_room_settings", {
    p_room_code: roomCode.toUpperCase(),
    p_visibility: payload.visibility,
    p_skill_mode: payload.skillMode,
    p_language_mode: payload.languageMode,
    p_language_pool: payload.languagePool,
    p_single_language: payload.singleLanguage,
    p_round_count: payload.roundCount,
    p_player_cap: payload.playerCap,
    p_profanity_filter_enabled: payload.profanityFilterEnabled,
    p_quick_play_discoverable: payload.quickPlayDiscoverable,
  });
}

export async function startGame(roomCode: string) {
  return callRpc("start_game", {
    p_room_code: roomCode.toUpperCase(),
  });
}

export async function submitRoundEntry(
  roomCode: string,
  payload: z.infer<typeof submitRoundSchema>,
) {
  const result = await callRpc("submit_round_entry", {
    p_room_code: roomCode.toUpperCase(),
    p_text: payload.text,
    p_prompt_record_id: payload.promptRecordId ?? null,
    p_prompt_source_type: payload.promptSourceType,
  });

  await ensureReplaySnapshotForRoom(roomCode);
  return result;
}

export async function advanceIfDue(roomCode: string) {
  const result = await callRpc("advance_if_due", {
    p_room_code: roomCode.toUpperCase(),
  });

  await ensureReplaySnapshotForRoom(roomCode);
  return result;
}

export async function heartbeatRoom(roomCode: string) {
  return callRpc("heartbeat_room", {
    p_room_code: roomCode.toUpperCase(),
  });
}

export async function toggleNextGameQueue(roomCode: string, queued?: boolean) {
  return callRpc("toggle_next_game_queue", {
    p_room_code: roomCode.toUpperCase(),
    p_queued: queued ?? null,
  });
}

export async function moderateRoomMember(
  roomCode: string,
  payload: z.infer<typeof moderateMemberSchema>,
) {
  return callRpc("moderate_room_member", {
    p_room_code: roomCode.toUpperCase(),
    p_member_id: payload.memberId,
    p_ban: payload.ban,
    p_reason: payload.reason ?? "Removed by host",
  });
}

export async function reactRevealStep(
  roomCode: string,
  payload: z.infer<typeof reactionSchema>,
) {
  return callRpc("react_reveal_step", {
    p_room_code: roomCode.toUpperCase(),
    p_step_id: payload.stepId,
    p_emoji: payload.emoji,
  });
}

export async function favoriteChainStep(
  roomCode: string,
  payload: z.infer<typeof favoriteSchema>,
) {
  return callRpc("favorite_chain_step", {
    p_room_code: roomCode.toUpperCase(),
    p_chain_id: payload.chainId,
    p_step_id: payload.stepId,
  });
}

export async function reportRoom(
  roomCode: string,
  payload: z.infer<typeof reportSchema>,
) {
  return callRpc("report_room", {
    p_room_code: roomCode.toUpperCase(),
    p_reason: payload.reason,
    p_details: payload.details ?? null,
  });
}

export async function reportReplay(
  replaySlug: string,
  payload: z.infer<typeof reportSchema>,
) {
  return callRpc("report_replay", {
    p_replay_slug: replaySlug,
    p_reason: payload.reason,
    p_details: payload.details ?? null,
  });
}

export async function pinReplay(replaySlug: string, pinned: boolean) {
  return callRpc("pin_replay", {
    p_replay_slug: replaySlug,
    p_pinned: pinned,
  });
}
