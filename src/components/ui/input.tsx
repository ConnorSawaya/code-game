import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-[18px] border border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,241,228,0.94))] px-4 text-sm text-[color:var(--color-ink)] shadow-[var(--shadow-press)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cobalt)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] placeholder:text-[color:var(--color-muted)]/70",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
