"use client";

import { useState } from "react";
import { Mail, Pin, TestTube2 } from "lucide-react";
import { getPublicEnv } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/features/supabase/browser";
import { postJson } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function AccountPanel({
  viewer,
  replays,
}: {
  viewer: {
    id: string;
    nickname: string;
    isGuest: boolean;
    email: string | null;
  } | null;
  replays: Array<{
    gameId: string;
    replaySlug: string;
    completedAt: string | null;
    roomCode: string;
    skillMode: string;
    pinned: boolean;
  }>;
}) {
  const env = getPublicEnv();
  const supabaseConfigured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const [email, setEmail] = useState(viewer?.email ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [localPins, setLocalPins] = useState<Record<string, boolean>>({});

  const handleUpgrade = async () => {
    if (!supabaseConfigured) {
      toast.error("Magic-link upgrade needs Supabase env.");
      return;
    }

    try {
      setLoading("upgrade");
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        email,
      });

      if (error) {
        throw error;
      }

      toast.success("Magic link sent. Check your inbox to finish the upgrade.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send magic link.");
    } finally {
      setLoading(null);
    }
  };

  const handlePin = async (slug: string, pinned: boolean) => {
    if (slug.startsWith("demo-")) {
      setLocalPins((current) => ({ ...current, [slug]: !pinned }));
      toast.success(!pinned ? "Demo replay pinned locally." : "Demo replay unpinned locally.");
      return;
    }

    try {
      setLoading(slug);
      await postJson(`/api/replay/${slug}/pin`, {
        pinned: !pinned,
      });
      toast.success(!pinned ? "Replay pinned." : "Replay unpinned.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update replay pin.");
    } finally {
      setLoading(null);
    }
  };

  if (!viewer) {
    return (
      <div className="section-grid">
        <Card className="mx-auto max-w-2xl space-y-5 p-8 text-center">
          <Badge>Account</Badge>
          <CardTitle>Guest-first product, very light account surface.</CardTitle>
          <CardDescription>
            Real account data appears here once Supabase auth is configured. For now, you can still use demo mode and the play flow without a traditional sign-in screen.
          </CardDescription>
          <div className="stack-panel px-5 py-5 text-left">
            <p className="label-mono text-[color:var(--color-text-muted)]">What belongs here later</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-text)]">
              Email linking, portable replay history, and any lightweight profile settings that survive across sessions.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="section-grid">
      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <Badge>{viewer.isGuest ? "Guest profile" : "Linked profile"}</Badge>
            {viewer.id === "demo-viewer" ? (
              <TestTube2 className="h-5 w-5 text-[color:var(--color-warning)]" />
            ) : null}
          </div>
          <div>
            <CardTitle>{viewer.nickname}</CardTitle>
            <CardDescription className="mt-2">
              Guests can play instantly. Add an email when you want portable history and pinned replays that survive cleanup.
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Identity</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {viewer.isGuest ? "Guest" : "Linked"}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Replays</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {replays.length}
              </p>
            </div>
          </div>
          <Field>
            <FieldLabel>Email upgrade</FieldLabel>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <FieldHint>
              Relay uses a magic link instead of a full password flow in v1.
            </FieldHint>
          </Field>
          <Button onClick={handleUpgrade} disabled={loading === "upgrade" || email.trim().length < 5}>
            <Mail className="h-4 w-4" />
            {loading === "upgrade"
              ? "Sending..."
              : viewer.isGuest
                ? "Upgrade with magic link"
                : "Update email"}
          </Button>
        </Card>
        <Card className="space-y-5">
          <div>
            <Badge>Replay shelf</Badge>
            <CardTitle className="mt-3">Saved game history</CardTitle>
            <CardDescription className="mt-2">
              Pin the good ones. Open the cursed ones again later. Keep the account surface simple.
            </CardDescription>
          </div>
          <div className="space-y-3">
            {replays.length === 0 ? (
              <div className="stack-panel px-5 py-5 text-[color:var(--color-text-muted)]">
                No completed replays yet. Finish a reveal and this shelf will start looking useful.
              </div>
            ) : null}
            {replays.map((replay) => {
              const effectivePinned = localPins[replay.replaySlug] ?? replay.pinned;

              return (
                <div
                  key={replay.gameId}
                  className="stack-panel flex flex-wrap items-center justify-between gap-4 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--color-text-strong)]">
                      Replay {replay.replaySlug}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                      Room {replay.roomCode} / {replay.skillMode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => window.location.assign(`/replay/${replay.replaySlug}`)}>
                      Open replay
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void handlePin(replay.replaySlug, effectivePinned)}
                      disabled={loading === replay.replaySlug}
                    >
                      <Pin className="h-4 w-4" />
                      {effectivePinned ? "Unpin" : "Pin"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
