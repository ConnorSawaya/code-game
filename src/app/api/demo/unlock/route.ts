import { cookies } from "next/headers";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/http";
import {
  DEMO_COOKIE_NAME,
  DEMO_COOKIE_VALUE,
  DEMO_PASSWORD,
} from "@/features/demo/shared";

const payloadSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = payloadSchema.parse(await request.json());

    if (body.password !== DEMO_PASSWORD) {
      return jsonError("That demo password is not correct.", 403);
    }

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
