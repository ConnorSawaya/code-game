import { RouteError, getErrorDetails, requireUser } from "@/features/api/route-utils";
import { enforceRateLimit, getClientIp } from "@/features/moderation/rate-limit";
import { verifyTurnstileToken } from "@/features/moderation/turnstile";
import { jsonError, jsonOk } from "@/lib/http";
import { reportRoom, reportSchema } from "@/features/rooms/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const user = await requireUser();
    const body = reportSchema.parse(await request.json());
    const ip = getClientIp(request.headers);
    const allowed = await enforceRateLimit({
      action: "report-room",
      userId: user.id,
      ip,
      maxHits: 8,
      windowSeconds: 300,
    });

    if (!allowed) {
      throw new RouteError("You've hit the room report limit. Please try again later.", 429);
    }

    const verified = await verifyTurnstileToken(body.turnstileToken, ip);

    if (!verified) {
      throw new RouteError("Turnstile verification failed.", 403);
    }

    const { code } = await params;
    const result = await reportRoom(code, body);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
