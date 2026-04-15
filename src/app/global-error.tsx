"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[color:var(--color-background)] p-8 text-[color:var(--color-ink)]">
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4">
          <p className="text-sm uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Relay hit an unexpected issue.
          </p>
          <h1 className="font-display text-4xl tracking-[-0.05em]">
            The room glitched, but your work might still be safe.
          </h1>
          <p className="text-lg leading-8 text-[color:var(--color-muted)]">
            We logged the error for follow-up. Try resetting the page first, then jump back to the room if needed.
          </p>
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
