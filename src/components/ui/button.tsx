"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[12px] border px-4 py-2.5 text-sm font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-main)] disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-[rgba(0,122,204,0.65)] bg-[linear-gradient(180deg,var(--color-accent),#0661a6)] text-white hover:border-[color:var(--color-accent-hover)] hover:bg-[linear-gradient(180deg,var(--color-accent-hover),var(--color-accent))] active:translate-y-px",
        secondary:
          "border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-strong)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-panel)] active:translate-y-px",
        accent:
          "border-[rgba(46,160,67,0.45)] bg-[linear-gradient(180deg,var(--color-success),#247d34)] text-white hover:brightness-105 active:translate-y-px",
        ghost:
          "border-transparent bg-transparent text-[color:var(--color-text-soft)] hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-bg-elevated)] hover:text-[color:var(--color-text-strong)]",
      },
      size: {
        sm: "h-9 px-3 text-[0.82rem]",
        md: "h-11 px-4.5 text-sm",
        lg: "h-12 px-5 text-sm",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
