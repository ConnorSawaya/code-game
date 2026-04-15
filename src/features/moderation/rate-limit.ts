import { createHash } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/features/supabase/server";

export function getClientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export async function enforceRateLimit(params: {
  action: string;
  userId: string;
  ip: string;
  maxHits: number;
  windowSeconds: number;
}) {
  const env = getServerEnv();
  const supabase = await createSupabaseServerClient();
  const keyHash = createHash("sha256")
    .update(
      `${env.RATE_LIMIT_SALT}:${params.action}:${params.userId}:${params.ip}`,
      "utf8",
    )
    .digest("hex");

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_action: params.action,
    p_key_hash: keyHash,
    p_max_hits: params.maxHits,
    p_window_seconds: params.windowSeconds,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}
