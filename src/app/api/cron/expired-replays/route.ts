import { jsonError, jsonOk } from "@/lib/http";
import { getErrorDetails } from "@/features/api/route-utils";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/features/supabase/admin";
import { assertCronAuthorized } from "@/features/cron/auth";

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const supabase = getSupabaseAdminClient();
    const env = getServerEnv();

    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    const { data: expiredGamesRaw } = await supabase
      .from("games")
      .select("id, replay_storage_path")
      .lt("completed_at", cutoff)
      .not("replay_slug", "is", null);

    const expiredGames =
      (expiredGamesRaw as { id: string; replay_storage_path: string | null }[] | null) ?? [];
    const gameIds = (expiredGames ?? []).map((game) => game.id);
    const { data: pinsRaw } = await supabase
      .from("replay_pins")
      .select("game_id")
      .in("game_id", gameIds.length > 0 ? gameIds : ["00000000-0000-0000-0000-000000000000"]);

    const pins = (pinsRaw as { game_id: string }[] | null) ?? [];
    const pinnedGameIds = new Set((pins ?? []).map((pin) => pin.game_id));
    const removablePaths = (expiredGames ?? [])
      .filter((game) => !pinnedGameIds.has(game.id))
      .map((game) => game.replay_storage_path)
      .filter(Boolean) as string[];

    if (removablePaths.length > 0) {
      await supabase.storage.from(env.SUPABASE_REPLAY_BUCKET).remove(removablePaths);
    }

    if (gameIds.length > 0) {
      await supabase
        .from("games")
        .update({ replay_storage_path: null } as never)
        .in("id", [...gameIds].filter((id) => !pinnedGameIds.has(id)));
    }

    return jsonOk({ ok: true, removed: removablePaths.length });
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
