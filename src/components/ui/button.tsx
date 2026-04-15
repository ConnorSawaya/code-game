"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cobalt)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[color:var(--color-ink)] text-white shadow-[0_14px_30px_rgba(20,28,43,0.18)] hover:-translate-y-0.5 hover:bg-[color:var(--color-cobalt)]",
        secondary:
          "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-ink)] hover:-translate-y-0.5 hover:border-[color:var(--color-cobalt)] hover:text-[color:var(--color-cobalt)]",
        accent:
          "border-transparent bg-[color:var(--color-coral)] text-white shadow-[0_14px_30px_rgba(232,111,91,0.22)] hover:-translate-y-0.5 hover:brightness-105",
        ghost:
          "border-transparent bg-transparent text-[color:var(--color-ink)] hover:bg-white/60",
      },
      size: {
        sm: "h-10 px-3.5",
        md: "h-11 px-4.5",
        lg: "h-12 px-5 text-base",
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
