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
      <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-[18px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,239,226,0.94))] shadow-[var(--shadow-panel)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_26%_22%,rgba(239,109,75,0.34),transparent_52%),radial-gradient(circle_at_76%_72%,rgba(53,90,216,0.34),transparent_48%)]" />
        <span className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.42))]" />
        <span className="relative font-display text-lg font-bold tracking-[-0.08em] text-[color:var(--color-ink)]">
          R
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.25rem] font-semibold tracking-[-0.07em] text-[color:var(--color-ink)]">
          Relay
        </span>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Code-chain party game
        </span>
      </span>
    </Link>
  );
}
