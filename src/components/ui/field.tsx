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
        "text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--color-muted)]",
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
      className={cn("text-sm text-[color:var(--color-muted)]", className)}
      {...props}
    />
  );
}
