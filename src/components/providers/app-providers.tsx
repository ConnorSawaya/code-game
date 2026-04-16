"use client";

import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { AuthBootstrap } from "@/components/providers/auth-bootstrap";
import { DemoModeProvider } from "@/components/providers/demo-mode-provider";

export function AppProviders({
  initialDemoMode,
  children,
}: PropsWithChildren<{
  initialDemoMode: boolean;
}>) {
  return (
    <DemoModeProvider initialDemoMode={initialDemoMode}>
      <AuthBootstrap />
      {children}
      <Toaster
        theme="dark"
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-[14px] !border !border-[color:var(--color-border)] !bg-[color:var(--color-bg-elevated)] !text-[color:var(--color-text-strong)] !shadow-[0_18px_45px_rgba(0,0,0,0.35)]",
            title: "!font-medium",
            description: "!text-[color:var(--color-text-muted)]",
          },
        }}
      />
    </DemoModeProvider>
  );
}
