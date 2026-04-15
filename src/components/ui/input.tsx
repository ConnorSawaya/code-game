import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border border-[color:var(--color-border)] bg-white/85 px-4 text-sm text-[color:var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cobalt)] placeholder:text-[color:var(--color-muted)]/70",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
