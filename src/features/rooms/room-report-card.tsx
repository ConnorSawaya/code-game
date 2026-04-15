"use client";

import { Flag, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

export function RoomReportCard({
  reportReason,
  setReportReason,
  reportDetails,
  setReportDetails,
  onReport,
  onRefresh,
  onTurnstileToken,
  submitting,
}: {
  reportReason: string;
  setReportReason: (value: string) => void;
  reportDetails: string;
  setReportDetails: (value: string) => void;
  onReport: () => void;
  onRefresh: () => void;
  onTurnstileToken: (token: string) => void;
  submitting: string | null;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge>Moderation</Badge>
            <CardTitle className="mt-3">Report this room</CardTitle>
            <CardDescription className="mt-2">
              Public rooms support reporting without adding freeform lobby chat.
            </CardDescription>
          </div>
          <Flag className="h-5 w-5 text-[color:var(--color-coral)]" />
        </div>
        <Field>
          <FieldLabel>Reason</FieldLabel>
          <Input
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            placeholder="Harassment, spam, offensive content..."
          />
        </Field>
        <Field>
          <FieldLabel>Details</FieldLabel>
          <Textarea minRows={4} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} />
        </Field>
        <TurnstileWidget onToken={onTurnstileToken} />
        <Button
          variant="secondary"
          onClick={onReport}
          disabled={submitting === "report" || reportReason.trim().length < 4}
        >
          {submitting === "report" ? "Sending report..." : "Report room"}
        </Button>
      </Card>
      <Card className="space-y-4">
        <div>
          <Badge>Realtime</Badge>
          <CardTitle className="mt-3">Room sync stays live.</CardTitle>
          <CardDescription className="mt-2">
            Relay uses Realtime subscriptions plus a heartbeat to keep room state, timers, and reveals moving.
          </CardDescription>
        </div>
        <div className="stack-panel space-y-3 px-5 py-5 text-sm leading-7 text-[color:var(--color-muted)]">
          <p>Reconnects restore your seat and local draft automatically.</p>
          <p>Missed turns wait for a 90-second grace window before Relay inserts fallback content.</p>
          <p>Replay links stay unlisted and can be pinned after an email upgrade.</p>
        </div>
        <Button variant="ghost" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4" />
          Refresh room state
        </Button>
      </Card>
    </section>
  );
}
