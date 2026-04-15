import { enforceRateLimit, getClientIp } from "@/features/moderation/rate-limit";
import { RouteError, getErrorDetails, requireUser } from "@/features/api/route-utils";
import { jsonError, jsonOk } from "@/lib/http";
import { reactRevealStep, reactionSchema } from "@/features/rooms/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const user = await requireUser();
    const body = reactionSchema.parse(await request.json());
    const ip = getClientIp(request.headers);
    const allowed = await enforceRateLimit({
      action: "react-step",
      userId: user.id,
      ip,
      maxHits: 50,
      windowSeconds: 60,
    });

    if (!allowed) {
      throw new RouteError("You're reacting too quickly. Slow down a bit.", 429);
    }

    const { code } = await params;
    const result = await reactRevealStep(code, body);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
