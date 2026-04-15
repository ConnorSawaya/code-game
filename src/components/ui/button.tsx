"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[18px] border px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cobalt)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,var(--color-cobalt),var(--color-cobalt-strong))] text-white shadow-[var(--shadow-lift)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5 active:shadow-[var(--shadow-press)]",
        secondary:
          "border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,241,228,0.98))] text-[color:var(--color-ink)] shadow-[var(--shadow-press)] hover:-translate-y-0.5 hover:border-[color:var(--color-cobalt)] hover:text-[color:var(--color-cobalt)] active:translate-y-0.5",
        accent:
          "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,var(--color-coral),var(--color-coral-strong))] text-white shadow-[0_18px_34px_rgba(239,109,75,0.28)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5",
        ghost:
          "border-transparent bg-[rgba(255,255,255,0.42)] text-[color:var(--color-ink-soft)] hover:bg-white/72 hover:text-[color:var(--color-ink)]",
      },
      size: {
        sm: "h-10 px-3.5 text-sm",
        md: "h-12 px-5 text-sm",
        lg: "h-14 px-6 text-base",
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
