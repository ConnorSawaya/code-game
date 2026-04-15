import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,241,228,0.94))] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)] shadow-[0_10px_24px_rgba(31,36,48,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
