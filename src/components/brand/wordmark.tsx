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
      <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-[12px] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,#111820,#0d1117)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(24,144,241,0.4),transparent_46%),radial-gradient(circle_at_76%_78%,rgba(46,160,67,0.24),transparent_42%)]" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-[rgba(255,255,255,0.1)]" />
        <span className="relative font-display text-lg font-bold tracking-[-0.08em] text-[color:var(--color-text-strong)]">
          R
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.18rem] font-semibold tracking-[-0.06em] text-[color:var(--color-text-strong)]">
          Relay
        </span>
        <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
          ship the chaos
        </span>
      </span>
    </Link>
  );
}
