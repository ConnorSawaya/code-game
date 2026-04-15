import "server-only";

import { getServerEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/features/supabase/admin";
import {
  buildReplaySnapshot,
  ensureReplaySnapshotStored,
  type ReplaySnapshot,
} from "@/features/replays/snapshot";

export async function getReplayBySlug(slug: string): Promise<ReplaySnapshot | null> {
  const supabase = getSupabaseAdminClient();
  const env = getServerEnv();
  const { data: replayRowResult } = await supabase
    .from("public_replay_shares")
    .select("game_id, replay_slug, replay_storage_path")
    .eq("replay_slug", slug)
    .maybeSingle();
  const replayRow = replayRowResult as
    | {
        game_id: string;
        replay_slug: string;
        replay_storage_path: string | null;
      }
    | null;

  if (!replayRow) {
    return null;
  }

  const storagePath =
    replayRow.replay_storage_path ??
    (await ensureReplaySnapshotStored(replayRow.game_id));

  const { data, error } = await supabase.storage
    .from(env.SUPABASE_REPLAY_BUCKET)
    .download(storagePath);

  if (error) {
    return buildReplaySnapshot(replayRow.game_id);
  }

  const json = JSON.parse(await data.text()) as ReplaySnapshot;
  return json;
}
