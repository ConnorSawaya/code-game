import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/http";
import { getErrorDetails } from "@/features/api/route-utils";
import { toggleReady } from "@/features/rooms/service";

const payloadSchema = z.object({
  ready: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const body = payloadSchema.parse(await request.json());
    const { code } = await params;
    const result = await toggleReady(code, body.ready);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
