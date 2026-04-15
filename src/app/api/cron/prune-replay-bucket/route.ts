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

    const { data: storageObjectsRaw } = await supabase.storage
      .from(env.SUPABASE_REPLAY_BUCKET)
      .list("replays", {
        limit: 1000,
      });

    const { data: gamesRaw } = await supabase
      .from("games")
      .select("replay_storage_path")
      .not("replay_storage_path", "is", null);

    const storageObjects = (storageObjectsRaw as { name: string }[] | null) ?? [];
    const games = (gamesRaw as { replay_storage_path: string | null }[] | null) ?? [];

    const activePaths = new Set(games.map((game) => game.replay_storage_path));
    const orphanPaths = storageObjects
      .map((object) => `replays/${object.name}`)
      .filter((path) => !activePaths.has(path));

    if (orphanPaths.length > 0) {
      await supabase.storage.from(env.SUPABASE_REPLAY_BUCKET).remove(orphanPaths);
    }

    return jsonOk({ ok: true, removed: orphanPaths.length });
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
