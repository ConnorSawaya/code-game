import "server-only";

import type { ChainSnapshot, ChainStep } from "@/features/game/types";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/features/supabase/admin";

export interface ReplaySnapshot {
  gameId: string;
  replaySlug: string;
  roomCode: string;
  skillMode: string;
  isDemo?: boolean;
  completedAt: string | null;
  members: Record<string, { nickname: string; role: string }>;
  chains: ChainSnapshot[];
  reactionsByStep: Record<string, Record<string, number>>;
  favoritesByStep: Record<string, number>;
}

function groupReactions(
  reactions: Array<{ step_id: string; emoji: string }>,
): Record<string, Record<string, number>> {
  return reactions.reduce<Record<string, Record<string, number>>>(
    (accumulator, reaction) => {
      accumulator[reaction.step_id] ??= {};
      accumulator[reaction.step_id][reaction.emoji] =
        (accumulator[reaction.step_id][reaction.emoji] ?? 0) + 1;
      return accumulator;
    },
    {},
  );
}

function groupFavorites(
  favorites: Array<{ step_id: string }>,
): Record<string, number> {
  return favorites.reduce<Record<string, number>>((accumulator, favorite) => {
    accumulator[favorite.step_id] = (accumulator[favorite.step_id] ?? 0) + 1;
    return accumulator;
  }, {});
}

export async function buildReplaySnapshot(gameId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: gameResult } = await supabase
    .from("games")
    .select("id, replay_slug, completed_at, room_id")
    .eq("id", gameId)
    .single();
  const game = gameResult as {
    id: string;
    replay_slug: string;
    completed_at: string | null;
    room_id: string;
  } | null;

  if (!game) {
    throw new Error("Replay game not found.");
  }

  const { data: roomResult } = await supabase
    .from("rooms")
    .select("code, skill_mode")
    .eq("id", game.room_id)
    .single();
  const room = roomResult as { code: string; skill_mode: string } | null;

  if (!room) {
    throw new Error("Replay room not found.");
  }

  const { data: membersResult } = await supabase
    .from("room_members")
    .select("id, nickname, role")
    .eq("room_id", game.room_id);
  const members = (membersResult ?? []) as Array<{
    id: string;
    nickname: string;
    role: string;
  }>;

  const { data: chainsResult } = await supabase
    .from("chains")
    .select("id, origin_member_id, origin_seat_index, prompt_source_type, prompt_record_id")
    .eq("game_id", game.id)
    .order("origin_seat_index", { ascending: true });
  const chains = (chainsResult ?? []) as Array<{
    id: string;
    origin_member_id: string;
    origin_seat_index: number;
    prompt_source_type: "custom" | "library" | "fallback";
    prompt_record_id: string | null;
  }>;

  const chainIds = chains.map((chain) => chain.id);
  const { data: stepsResult } = await supabase
    .from("chain_steps")
    .select(
      "id, chain_id, round_index, step_type, text, language, fallback, author_member_id, created_at",
    )
    .in("chain_id", chainIds.length > 0 ? chainIds : ["00000000-0000-0000-0000-000000000000"])
    .order("round_index", { ascending: true });
  const steps = (stepsResult ?? []) as Array<{
    id: string;
    chain_id: string;
    round_index: number;
    step_type: ChainStep["stepType"];
    text: string;
    language: ChainStep["language"];
    fallback: boolean;
    author_member_id: string | null;
    created_at: string;
  }>;

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

  const memberLookup = Object.fromEntries(
    members.map((member) => [
      member.id,
      {
        nickname: member.nickname,
        role: member.role,
      },
    ]),
  );

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

  return {
    gameId: game.id,
    replaySlug: game.replay_slug,
    roomCode: room.code,
    skillMode: room.skill_mode,
    completedAt: game.completed_at,
    members: memberLookup,
    chains: chains.map((chain) => ({
      id: chain.id,
      originMemberId: chain.origin_member_id,
      originSeatIndex: chain.origin_seat_index,
      promptSourceType: chain.prompt_source_type,
      promptRecordId: chain.prompt_record_id,
      steps: stepLookup[chain.id] ?? [],
    })),
    reactionsByStep: groupReactions(reactions),
    favoritesByStep: groupFavorites(favorites),
  } satisfies ReplaySnapshot;
}

export async function ensureReplaySnapshotStored(gameId: string) {
  const supabase = getSupabaseAdminClient();
  const env = getServerEnv();
  const { data: gameResult } = await supabase
    .from("games")
    .select("id, replay_slug, replay_storage_path")
    .eq("id", gameId)
    .single();
  const game = gameResult as
    | {
        id: string;
        replay_slug: string;
        replay_storage_path: string | null;
      }
    | null;

  if (!game) {
    throw new Error("Replay game not found.");
  }

  if (game.replay_storage_path) {
    return game.replay_storage_path;
  }

  const snapshot = await buildReplaySnapshot(gameId);
  const storagePath = `replays/${snapshot.replaySlug}.json`;
  const snapshotBlob = new Blob([JSON.stringify(snapshot)], {
    type: "application/json",
  });

  const { error: uploadError } = await supabase.storage
    .from(env.SUPABASE_REPLAY_BUCKET)
    .upload(storagePath, snapshotBlob, {
      cacheControl: "3600",
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({ replay_storage_path: storagePath } as never)
    .eq("id", gameId);

  if (updateError) {
    throw updateError;
  }

  return storagePath;
}
