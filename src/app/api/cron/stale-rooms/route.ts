import { jsonError, jsonOk } from "@/lib/http";
import { getErrorDetails } from "@/features/api/route-utils";
import { getSupabaseAdminClient } from "@/features/supabase/admin";
import { assertCronAuthorized } from "@/features/cron/auth";

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const supabase = getSupabaseAdminClient();

    await supabase
      .from("room_members")
      .delete()
      .lt("last_seen_at", new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString())
      .eq("role", "spectator");

    await supabase
      .from("rooms")
      .delete()
      .eq("status", "lobby")
      .lt("last_activity_at", new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString());

    return jsonOk({ ok: true });
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
