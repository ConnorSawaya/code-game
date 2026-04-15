import { RouteError, getErrorDetails, requireUser } from "@/features/api/route-utils";
import { enforceRateLimit, getClientIp } from "@/features/moderation/rate-limit";
import { verifyTurnstileToken } from "@/features/moderation/turnstile";
import { jsonError, jsonOk } from "@/lib/http";
import { reportReplay, reportSchema } from "@/features/rooms/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireUser();
    const body = reportSchema.parse(await request.json());
    const ip = getClientIp(request.headers);
    const allowed = await enforceRateLimit({
      action: "report-replay",
      userId: user.id,
      ip,
      maxHits: 8,
      windowSeconds: 300,
    });

    if (!allowed) {
      throw new RouteError("You've hit the replay report limit. Please try again later.", 429);
    }

    const verified = await verifyTurnstileToken(body.turnstileToken, ip);

    if (!verified) {
      throw new RouteError("Turnstile verification failed.", 403);
    }

    const { slug } = await params;
    const result = await reportReplay(slug, body);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
