import { jsonError, jsonOk } from "@/lib/http";
import { getErrorDetails } from "@/features/api/route-utils";
import { pinReplay, pinReplaySchema } from "@/features/rooms/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const body = pinReplaySchema.parse(await request.json());
    const { slug } = await params;
    const result = await pinReplay(slug, body.pinned);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
