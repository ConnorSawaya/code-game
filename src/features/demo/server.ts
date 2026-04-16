import "server-only";

import { cookies } from "next/headers";
import {
  DEMO_COOKIE_NAME,
  DEMO_COOKIE_VALUE,
  DEMO_NICKNAME_COOKIE,
} from "@/features/demo/shared";

export async function isDemoModeEnabled() {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE;
}

export async function getServerNicknameFallback() {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_NICKNAME_COOKIE)?.value?.trim() || "late-night-dev";
}

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function hasSupabaseServerEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
