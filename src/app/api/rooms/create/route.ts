import { jsonError, jsonOk } from "@/lib/http";
import { RouteError, getErrorDetails, requireUser } from "@/features/api/route-utils";
import { createRoom, createRoomSchema } from "@/features/rooms/service";
import { enforceRateLimit, getClientIp } from "@/features/moderation/rate-limit";
import { verifyTurnstileToken } from "@/features/moderation/turnstile";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createRoomSchema.parse(await request.json());
    const ip = getClientIp(request.headers);
    const allowed = await enforceRateLimit({
      action: "create-room",
      userId: user.id,
      ip,
      maxHits: 10,
      windowSeconds: 60,
    });

    if (!allowed) {
      throw new RouteError("You're creating rooms too quickly. Please wait a moment.", 429);
    }

    if (body.visibility === "public") {
      const verified = await verifyTurnstileToken(body.turnstileToken, ip);

      if (!verified) {
        throw new RouteError("Turnstile verification failed.", 403);
      }
    }

    const result = await createRoom(body);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
