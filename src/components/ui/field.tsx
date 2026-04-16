import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-6 text-[color:var(--color-text-muted)]", className)}
      {...props}
    />
  );
}
