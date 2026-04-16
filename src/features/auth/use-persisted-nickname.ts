"use client";

import { useEffect, useState } from "react";
import { DEMO_NICKNAME_COOKIE } from "@/features/demo/shared";

const storageKey = "relay:nickname";

export function usePersistedNickname(initialNickname = "") {
  const [nickname, setNickname] = useState(() => {
    if (typeof window === "undefined") {
      return initialNickname;
    }

    return window.localStorage.getItem(storageKey) ?? initialNickname;
  });

  useEffect(() => {
    const normalized = nickname.trim();

    if (!normalized) {
      return;
    }

    window.localStorage.setItem(storageKey, normalized);
    document.cookie = `${DEMO_NICKNAME_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }, [nickname]);

  return {
    nickname,
    setNickname,
  };
}
