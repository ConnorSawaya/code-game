"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Pin, TestTube2 } from "lucide-react";
import type { ReplaySnapshot } from "@/features/replays/snapshot";
import { getLanguageLabel, getRoundLabel } from "@/features/game/logic";
import { postJson } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReadonlyCode } from "@/features/rooms/room-shared";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { toast } from "sonner";

export function ReplayViewer({
  replay,
  initiallyPinned = false,
}: {
  replay: ReplaySnapshot;
  initiallyPinned?: boolean;
}) {
  const router = useRouter();
  const [pinned, setPinned] = useState(initiallyPinned);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handlePin = async () => {
    if (replay.isDemo) {
      setPinned((current) => !current);
      toast.success("Demo replay pin toggled locally.");
      return;
    }

    try {
      setLoading("pin");
      await postJson(`/api/replay/${replay.replaySlug}/pin`, {
        pinned: !pinned,
      });
      setPinned((current) => !current);
      toast.success(!pinned ? "Replay pinned." : "Replay unpinned.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update pin.");
    } finally {
      setLoading(null);
    }
  };

  const handleReport = async () => {
    if (replay.isDemo) {
      toast.success("Demo replay report recorded locally.");
      setReportReason("");
      setReportDetails("");
      return;
    }

    try {
      setLoading("report");
      await postJson(`/api/replay/${replay.replaySlug}/report`, {
        reason: reportReason,
        details: reportDetails,
        turnstileToken,
      });
      setReportReason("");
      setReportDetails("");
      toast.success("Replay reported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to report this replay.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="section-grid">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Replay</Badge>
                {replay.isDemo ? <Badge>Demo</Badge> : null}
              </div>
              <CardTitle className="mt-3">Room {replay.roomCode}</CardTitle>
              <CardDescription className="mt-2">
                Unlisted playback for a completed Relay match. Good for sharing the exact moment the room lost the plot.
              </CardDescription>
            </div>
            <Button variant="secondary" onClick={handlePin} disabled={loading === "pin"}>
              <Pin className="h-4 w-4" />
              {loading === "pin" ? "Saving..." : pinned ? "Unpin replay" : "Pin replay"}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Chains</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                {replay.chains.length}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Skill</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                {replay.skillMode}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Room</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                {replay.roomCode}
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report replay</CardTitle>
              <CardDescription className="mt-2">
                Use this for public-room abuse, harassment, or content that should not stay in circulation.
              </CardDescription>
            </div>
            {replay.isDemo ? (
              <TestTube2 className="h-5 w-5 text-[color:var(--color-warning)]" />
            ) : (
              <Flag className="h-5 w-5 text-[color:var(--color-danger)]" />
            )}
          </div>
          <Field>
            <FieldLabel>Reason</FieldLabel>
            <Input value={reportReason} onChange={(event) => setReportReason(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Details</FieldLabel>
            <Textarea minRows={4} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} />
          </Field>
          <TurnstileWidget onToken={setTurnstileToken} />
          <Button
            variant="secondary"
            onClick={handleReport}
            disabled={loading === "report" || reportReason.trim().length < 4}
          >
            {loading === "report" ? "Sending..." : "Report replay"}
          </Button>
        </Card>
      </section>

      <Card className="space-y-5">
        {replay.chains.map((chain) => (
          <div key={chain.id} className="stack-panel overflow-hidden">
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="label-mono text-[color:var(--color-text-muted)]">
                    Chain {chain.originSeatIndex + 1}
                  </p>
                  <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                    Started by {replay.members[chain.originMemberId]?.nickname ?? "Unknown"}
                  </p>
                </div>
                <Badge>{chain.steps.length} steps</Badge>
              </div>
            </div>
            <div className="grid gap-4 px-5 py-5">
              {chain.steps.map((step) => (
                <div key={step.id} className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{getRoundLabel(step.roundIndex)}</Badge>
                    {step.language ? <Badge>{getLanguageLabel(step.language)}</Badge> : null}
                    {step.fallback ? <Badge>Fallback</Badge> : null}
                  </div>
                  <div className="mt-4">
                    {step.stepType === "code" ? (
                      <ReadonlyCode value={step.text} language={step.language} height={240} />
                    ) : (
                      <p className="text-base leading-8 text-[color:var(--color-text)] sm:text-lg">
                        {step.text}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 text-sm font-medium text-[color:var(--color-text-muted)]">
                    Favorites: {replay.favoritesByStep[step.id] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
