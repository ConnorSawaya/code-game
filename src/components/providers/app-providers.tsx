"use client";

import { Toaster } from "sonner";
import { AuthBootstrap } from "@/components/providers/auth-bootstrap";

export function AppProviders() {
  return (
    <>
      <AuthBootstrap />
      <Toaster
        theme="light"
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-[22px] !border !border-[color:var(--color-border)] !bg-[color:var(--color-surface)] !text-[color:var(--color-ink)] !shadow-[0_18px_45px_rgba(30,37,48,0.1)]",
            title: "!font-medium",
            description: "!text-[color:var(--color-muted)]",
          },
        }}
      />
    </>
  );
}
