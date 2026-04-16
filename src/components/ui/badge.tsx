import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[rgba(15,20,27,0.92)] px-3 py-1.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-soft)]",
        className,
      )}
      {...props}
    />
  );
}
