import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/http";
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from "@/features/demo/shared";

export async function POST(request: Request) {
  try {
    void request;

    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return jsonOk({ unlocked: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to unlock demo mode.", 400);
  }
}
