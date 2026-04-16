"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { getPublicEnv } from "@/lib/env";

export function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const env = getPublicEnv();
  const { demoMode } = useDemoMode();

  if (demoMode) {
    return (
      <div className="rounded-[14px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-3 py-2 text-sm text-[color:var(--color-text-muted)]">
        Demo mode bypasses Turnstile so you can test flows quickly.
      </div>
    );
  }

  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div className="rounded-[14px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] p-3">
      <Turnstile
        siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        onSuccess={onToken}
        options={{
          theme: "dark",
          size: "flexible",
        }}
      />
    </div>
  );
}
