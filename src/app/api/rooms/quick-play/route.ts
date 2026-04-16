import { getDemoRoomCodeForSkillMode } from "@/features/demo/shared";
import { isDemoModeEnabled } from "@/features/demo/server";
import { jsonError, jsonOk } from "@/lib/http";
import { RouteError, getErrorDetails, requireUser } from "@/features/api/route-utils";
import { enforceRateLimit, getClientIp } from "@/features/moderation/rate-limit";
import { verifyTurnstileToken } from "@/features/moderation/turnstile";
import { quickPlay, quickPlaySchema } from "@/features/rooms/service";

export async function POST(request: Request) {
  try {
    const body = quickPlaySchema.parse(await request.json());

    if (body.demoMode && (await isDemoModeEnabled())) {
      return jsonOk({
        room_code: getDemoRoomCodeForSkillMode(body.skillMode),
      });
    }

    const user = await requireUser();
    const ip = getClientIp(request.headers);
    const allowed = await enforceRateLimit({
      action: "quick-play",
      userId: user.id,
      ip,
      maxHits: 10,
      windowSeconds: 60,
    });

    if (!allowed) {
      throw new RouteError("Quick Play is rate limited right now. Try again in a moment.", 429);
    }

    const verified = await verifyTurnstileToken(body.turnstileToken, ip);

    if (!verified) {
      throw new RouteError("Turnstile verification failed.", 403);
    }

    const result = await quickPlay(body);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
