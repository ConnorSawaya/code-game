import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: Route;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-white/90 shadow-[0_12px_24px_rgba(40,54,74,0.08)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(232,111,91,0.25),transparent_55%),radial-gradient(circle_at_70%_75%,rgba(70,102,201,0.25),transparent_50%)]" />
        <span className="relative font-display text-lg font-bold tracking-[-0.06em] text-[color:var(--color-ink)]">
          R
        </span>
      </span>
      <span className="font-display text-[1.25rem] font-semibold tracking-[-0.06em] text-[color:var(--color-ink)]">
        Relay
      </span>
    </Link>
  );
}
