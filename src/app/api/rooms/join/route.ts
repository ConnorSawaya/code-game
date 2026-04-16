import { isDemoModeEnabled } from "@/features/demo/server";
import { isDemoRoomCode } from "@/features/demo/shared";
import { jsonError, jsonOk } from "@/lib/http";
import { RouteError, getErrorDetails, requireUser } from "@/features/api/route-utils";
import { enforceRateLimit, getClientIp } from "@/features/moderation/rate-limit";
import { verifyTurnstileToken } from "@/features/moderation/turnstile";
import { getRoomVisibilityByCode } from "@/features/rooms/queries";
import { joinRoom, joinRoomSchema } from "@/features/rooms/service";

export async function POST(request: Request) {
  try {
    const body = joinRoomSchema.parse(await request.json());

    if (body.demoMode && (await isDemoModeEnabled()) && isDemoRoomCode(body.roomCode)) {
      return jsonOk({
        room_code: body.roomCode.toUpperCase(),
      });
    }

    const user = await requireUser();
    const ip = getClientIp(request.headers);
    const allowed = await enforceRateLimit({
      action: "join-room",
      userId: user.id,
      ip,
      maxHits: 24,
      windowSeconds: 60,
    });

    if (!allowed) {
      throw new RouteError("You're joining rooms too quickly. Please slow down.", 429);
    }

    const roomAccess = await getRoomVisibilityByCode(body.roomCode);

    if (roomAccess?.visibility === "public") {
      const verified = await verifyTurnstileToken(body.turnstileToken, ip);

      if (!verified) {
        throw new RouteError("Turnstile verification failed.", 403);
      }
    }

    const result = await joinRoom(body);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
