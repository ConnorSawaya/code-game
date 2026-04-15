"use client";

import { useEffect, useState } from "react";

const storageKey = "relay:nickname";

export function usePersistedNickname(initialNickname = "") {
  const [nickname, setNickname] = useState(() => {
    if (typeof window === "undefined") {
      return initialNickname;
    }

    return window.localStorage.getItem(storageKey) ?? initialNickname;
  });

  useEffect(() => {
    if (nickname.trim()) {
      window.localStorage.setItem(storageKey, nickname.trim());
    }
  }, [nickname]);

  return {
    nickname,
    setNickname,
  };
}
