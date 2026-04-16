import "server-only";

import { hasSupabasePublicEnv } from "@/features/demo/server";
import { createSupabaseServerClient } from "@/features/supabase/server";

export interface ViewerSummary {
  id: string;
  nickname: string;
  isGuest: boolean;
  email: string | null;
}

export async function getViewer() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, is_guest, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    nickname: profile.nickname,
    isGuest: profile.is_guest,
    email: profile.email,
  } satisfies ViewerSummary;
}
