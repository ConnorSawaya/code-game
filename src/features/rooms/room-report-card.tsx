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
  showReport = true,
}: {
  reportReason: string;
  setReportReason: (value: string) => void;
  reportDetails: string;
  setReportDetails: (value: string) => void;
  onReport: () => void;
  onRefresh: () => void;
  onTurnstileToken: (token: string) => void;
  submitting: string | null;
  showReport?: boolean;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge>{showReport ? "Room Tools" : "Room Status"}</Badge>
          <CardTitle className="mt-3">Keep the room moving.</CardTitle>
          <CardDescription className="mt-2">
            Refresh if something looks stale{showReport ? ", and report the room only if something is genuinely wrong." : "."}
          </CardDescription>
        </div>
        <Button variant="ghost" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {showReport ? (
        <details className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[color:var(--color-text-strong)] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Flag className="h-4 w-4 text-[color:var(--color-coral)]" />
              Report this room
            </span>
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              open form
            </span>
          </summary>
          <div className="mt-4 space-y-4">
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
          </div>
        </details>
      ) : null}
    </Card>
  );
}
