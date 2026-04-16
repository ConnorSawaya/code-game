import { cookies } from "next/headers";
import { jsonOk } from "@/lib/http";
import { DEMO_COOKIE_NAME } from "@/features/demo/shared";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);
  return jsonOk({ unlocked: false });
}
