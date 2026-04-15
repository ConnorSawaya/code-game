"use client";

import { useState } from "react";
import { Mail, Pin } from "lucide-react";
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
  const [email, setEmail] = useState(viewer?.email ?? "");
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async () => {
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

  return (
    <div className="section-grid">
      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5">
          <Badge>{viewer?.isGuest ? "Guest profile" : "Linked profile"}</Badge>
          <div>
            <CardTitle>{viewer?.nickname ?? "Loading profile..."}</CardTitle>
            <CardDescription className="mt-2">
              Guests can play immediately. Add an email when you want pinned replay history and a portable identity.
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Identity
              </p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                {viewer?.isGuest ? "Guest" : "Linked"}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Replays
              </p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em]">{replays.length}</p>
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
              Relay uses a magic link instead of a traditional password flow in v1.
            </FieldHint>
          </Field>
          <Button onClick={handleUpgrade} disabled={loading === "upgrade" || email.trim().length < 5}>
            <Mail className="h-4 w-4" />
            {loading === "upgrade"
              ? "Sending..."
              : viewer?.isGuest
                ? "Upgrade with magic link"
                : "Update email"}
          </Button>
        </Card>
        <Card className="space-y-5">
          <div>
            <Badge>Replay Shelf</Badge>
            <CardTitle className="mt-3">Saved game history</CardTitle>
            <CardDescription className="mt-2">
              Signed-in players can pin favorite replays so they survive guest expiry cleanup.
            </CardDescription>
          </div>
          <div className="space-y-3">
            {replays.length === 0 ? (
              <div className="stack-panel px-5 py-5 text-[color:var(--color-muted)]">
                No completed replays yet. Start a room and finish a reveal to populate this shelf.
              </div>
            ) : null}
            {replays.map((replay) => (
              <div
                key={replay.gameId}
                className="stack-panel flex flex-wrap items-center justify-between gap-4 px-4 py-4"
              >
                <div>
                  <p className="font-semibold">Replay {replay.replaySlug}</p>
                  <p className="text-sm text-[color:var(--color-muted)]">
                    Room {replay.roomCode} • {replay.skillMode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => window.location.assign(`/replay/${replay.replaySlug}`)}>
                    Open replay
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handlePin(replay.replaySlug, replay.pinned)}
                    disabled={loading === replay.replaySlug}
                  >
                    <Pin className="h-4 w-4" />
                    {replay.pinned ? "Unpin" : "Pin"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
