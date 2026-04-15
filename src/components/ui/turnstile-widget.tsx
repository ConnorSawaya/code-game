"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { getPublicEnv } from "@/lib/env";

export function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const env = getPublicEnv();

  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-dashed border-[color:var(--color-border)] bg-white/70 p-3">
      <Turnstile
        siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        onSuccess={onToken}
        options={{
          theme: "light",
          size: "flexible",
        }}
      />
    </div>
  );
}
