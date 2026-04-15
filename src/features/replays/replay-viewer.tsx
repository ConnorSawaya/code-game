"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Pin } from "lucide-react";
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
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge>Replay</Badge>
            <CardTitle className="mt-3">Room {replay.roomCode}</CardTitle>
            <CardDescription>
              Unlisted replay for a completed Relay match. Share the link directly with the people who should see it.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePin} disabled={loading === "pin"}>
              <Pin className="h-4 w-4" />
              {loading === "pin" ? "Saving..." : pinned ? "Unpin replay" : "Pin replay"}
            </Button>
          </div>
        </div>
        <div className="space-y-5">
          {replay.chains.map((chain) => (
            <div
              key={chain.id}
              className="rounded-[30px] border border-[color:var(--color-border)] bg-white/85 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                    Chain {chain.originSeatIndex + 1}
                  </p>
                  <p className="text-base text-[color:var(--color-muted)]">
                    Started by {replay.members[chain.originMemberId]?.nickname ?? "Unknown"}
                  </p>
                </div>
                <Badge>{chain.steps.length} steps</Badge>
              </div>
              <div className="grid gap-4">
                {chain.steps.map((step) => (
                  <div key={step.id} className="rounded-[24px] bg-[color:var(--color-surface)] px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{getRoundLabel(step.roundIndex)}</Badge>
                      {step.language ? <Badge>{getLanguageLabel(step.language)}</Badge> : null}
                      {step.fallback ? <Badge>Fallback</Badge> : null}
                    </div>
                    <div className="mt-4">
                      {step.stepType === "code"
                        ? <ReadonlyCode value={step.text} language={step.language} />
                        : <p className="text-lg leading-8">{step.text}</p>}
                    </div>
                    <div className="mt-4 text-sm text-[color:var(--color-muted)]">
                      Favorites: {replay.favoritesByStep[step.id] ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Report replay</CardTitle>
            <CardDescription>Use this if the replay contains public-room abuse, harassment, or inappropriate content.</CardDescription>
          </div>
          <Flag className="h-5 w-5 text-[color:var(--color-coral)]" />
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
        <Button variant="secondary" onClick={handleReport} disabled={loading === "report" || reportReason.trim().length < 4}>
          {loading === "report" ? "Sending..." : "Report replay"}
        </Button>
      </Card>
    </div>
  );
}
