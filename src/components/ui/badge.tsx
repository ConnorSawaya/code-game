import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-white/80 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--color-muted)]",
        className,
      )}
      {...props}
    />
  );
}
