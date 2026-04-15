import { getServerEnv } from "@/lib/env";

export async function verifyTurnstileToken(token: string | undefined, ip?: string) {
  const env = getServerEnv();

  if (!env.TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Turnstile is not configured.");
    }

    return true;
  }

  if (!token) {
    return false;
  }

  const formData = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  if (ip) {
    formData.set("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );

  const result = (await response.json()) as {
    success: boolean;
  };

  return result.success;
}
