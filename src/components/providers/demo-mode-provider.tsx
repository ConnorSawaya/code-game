"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, TestTube2, X } from "lucide-react";
import { postJson } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DemoModeContextValue {
  demoMode: boolean;
  dialogOpen: boolean;
  unlockPending: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  unlockDemoMode: (password: string) => Promise<void>;
  lockDemoMode: () => Promise<void>;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({
  initialDemoMode,
  children,
}: PropsWithChildren<{ initialDemoMode: boolean }>) {
  const [demoMode, setDemoMode] = useState(initialDemoMode);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unlockPending, setUnlockPending] = useState(false);
  const [password, setPassword] = useState("");

  const value = useMemo<DemoModeContextValue>(
    () => ({
      demoMode,
      dialogOpen,
      unlockPending,
      openDialog: () => setDialogOpen(true),
      closeDialog: () => setDialogOpen(false),
      unlockDemoMode: async (nextPassword: string) => {
        try {
          setUnlockPending(true);
          await postJson("/api/demo/unlock", { password: nextPassword });
          setDemoMode(true);
          setDialogOpen(false);
          setPassword("");
          toast.success("Demo mode unlocked. Mock rooms and test controls are live.");
          window.location.reload();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to unlock demo mode.");
        } finally {
          setUnlockPending(false);
        }
      },
      lockDemoMode: async () => {
        try {
          setUnlockPending(true);
          await postJson("/api/demo/lock", {});
          setDemoMode(false);
          setDialogOpen(false);
          setPassword("");
          toast.success("Demo mode locked.");
          window.location.reload();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to lock demo mode.");
        } finally {
          setUnlockPending(false);
        }
      },
    }),
    [demoMode, dialogOpen, unlockPending],
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {dialogOpen ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(2,6,12,0.76)] p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-panel)] text-[color:var(--color-accent)]">
                    <TestTube2 className="h-5 w-5" />
                  </div>
                  <div>
                    <FieldLabel>Demo / Testing Mode</FieldLabel>
                    <CardTitle className="mt-2 text-[1.55rem]">
                      Unlock the mock rooms
                    </CardTitle>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
                      Temporary dev-only access. This unlocks demo rooms, fake replay data,
                      and test controls for unfinished backend paths.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-panel)] text-[color:var(--color-text-muted)] transition hover:text-[color:var(--color-text-strong)]"
                  onClick={() => setDialogOpen(false)}
                  aria-label="Close demo mode dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Field className="mt-5">
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Enter temporary demo password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <FieldHint>
                  This is intentionally temporary and easy to replace later.
                </FieldHint>
              </Field>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => void value.unlockDemoMode(password)}
                  disabled={unlockPending || password.trim().length === 0}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {unlockPending ? "Unlocking..." : "Unlock demo mode"}
                </Button>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);

  if (!context) {
    throw new Error("useDemoMode must be used inside DemoModeProvider.");
  }

  return context;
}
