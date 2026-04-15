import { jsonError, jsonOk } from "@/lib/http";
import { getErrorDetails } from "@/features/api/route-utils";
import { moderateMemberSchema, moderateRoomMember } from "@/features/rooms/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const body = moderateMemberSchema.parse(await request.json());
    const { code } = await params;
    const result = await moderateRoomMember(code, body);
    return jsonOk(result);
  } catch (error) {
    const details = getErrorDetails(error);
    return jsonError(details.message, details.status, details.details);
  }
}
