import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 p-6 shadow-[0_25px_60px_rgba(40,54,74,0.08)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm leading-6 text-[color:var(--color-muted)]",
        className,
      )}
      {...props}
    />
  );
}
