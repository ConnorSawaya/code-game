"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/features/supabase/browser";
import { getPublicEnv } from "@/lib/env";

export function AuthBootstrap() {
  const router = useRouter();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    const env = getPublicEnv();

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    const bootstrap = async () => {
      if (bootstrappedRef.current) {
        return;
      }

      bootstrappedRef.current = true;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        await supabase.auth.signInAnonymously();
      }

      router.refresh();
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
