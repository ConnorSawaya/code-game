import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-3.5 text-sm text-[color:var(--color-text-strong)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-main)] placeholder:text-[color:var(--color-text-muted)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
