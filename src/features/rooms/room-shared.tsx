"use client";

import { useState } from "react";
import { Clock3, Copy, Eye, Play, Users } from "lucide-react";
import type { CodeLanguage, RoomSnapshot } from "@/features/game/types";
import { getRoundLabel, getSkillModeConfig } from "@/features/game/logic";
import { HtmlPreviewPanel } from "@/components/editor/html-preview-panel";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ReadonlyCode({
  value,
  language,
  allowPreview = true,
  height = 220,
}: {
  value: string;
  language: CodeLanguage | null;
  allowPreview?: boolean;
  height?: number;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!language) {
    return null;
  }

  const canPreview = allowPreview && language === "html_css_js";

  return (
    <div className="space-y-3">
      <MonacoCodeEditor
        value={value}
        language={language}
        readOnly
        height={height}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.14em] text-[#8390ab]">
              Read-only viewer
            </span>
            {canPreview ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#b9c6df] transition hover:bg-white/10"
                onClick={() => setPreviewOpen((current) => !current)}
              >
                <Eye className="h-3.5 w-3.5" />
                {previewOpen ? "Hide preview" : "Preview"}
              </button>
            ) : null}
          </div>
        }
      />
      {previewOpen ? <HtmlPreviewPanel snippet={value} height={260} /> : null}
    </div>
  );
}

export function RoomHeader({
  snapshot,
  timeRemaining,
  onCopyCode,
  onCopyReplay,
}: {
  snapshot: RoomSnapshot;
  timeRemaining: number | null;
  onCopyCode: () => void;
  onCopyReplay: () => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,109,75,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(53,90,216,0.14),transparent_30%)]" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{snapshot.code}</Badge>
            <Badge>{getSkillModeConfig(snapshot.settings.skillMode).label}</Badge>
            <Badge>
              {snapshot.status === "lobby"
                ? "Lobby"
                : snapshot.game
                  ? getRoundLabel(snapshot.game.roundIndex)
                  : "Room"}
            </Badge>
            {timeRemaining !== null ? (
              <Badge className="bg-[linear-gradient(180deg,rgba(53,90,216,0.18),rgba(53,90,216,0.1))] text-[color:var(--color-cobalt)]">
                <Clock3 className="h-3.5 w-3.5" />
                {timeRemaining}s left
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-3">
              <h1 className="font-display text-3xl tracking-[-0.05em] text-[color:var(--color-ink)] sm:text-[2.6rem]">
                {snapshot.roomName}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--color-muted)] sm:text-lg">
                {snapshot.status === "lobby"
                  ? "Tune the room, stack the roster, and get everyone ready before the first prompt lands."
                  : snapshot.game?.phase === "reveal"
                    ? "The whole chain is on stage now. React, favorite the wildest jumps, and pass the replay around."
                    : "Only the immediately previous step is visible. The full chain stays hidden until the reveal."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="stack-panel px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                  Room Code
                </p>
                <p className="mt-2 font-display text-2xl tracking-[-0.05em]">{snapshot.code}</p>
              </div>
              <div className="stack-panel px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                  Players
                </p>
                <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                  {snapshot.members.filter((member) => member.role !== "spectator").length}
                </p>
              </div>
              <div className="stack-panel px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                  Round Mode
                </p>
                <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                  {snapshot.status === "lobby" ? "Setup" : snapshot.game?.phase ?? "Live"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onCopyCode}>
              <Copy className="h-4 w-4" />
              Copy room code
            </Button>
            {snapshot.game?.replaySlug ? (
              <Button variant="ghost" onClick={onCopyReplay}>
                <Copy className="h-4 w-4" />
                Copy replay link
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function RoomRosterCard({
  snapshot,
  submitting,
  onToggleReady,
  onStart,
  onQueueNextGame,
  onModerate,
}: {
  snapshot: RoomSnapshot;
  submitting: string | null;
  onToggleReady: () => void;
  onStart: () => void;
  onQueueNextGame?: () => void;
  onModerate?: (memberId: string, ban: boolean) => void;
}) {
  const activePlayers = snapshot.members.filter(
    (member) => member.role === "host" || member.role === "player",
  ).length;
  const spectators = snapshot.members.filter((member) => member.role === "spectator").length;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Room Roster</CardTitle>
          <CardDescription>
            {activePlayers} active players, {spectators} spectators.
          </CardDescription>
        </div>
        <div className="surface-pill rounded-full px-3 py-2 text-[color:var(--color-cobalt)]">
          <Users className="h-5 w-5" />
        </div>
      </div>
      <div className="space-y-3">
        {snapshot.members.map((member) => (
          <div
            key={member.id}
            className="stack-panel flex flex-wrap items-center justify-between gap-3 px-4 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold">
                  {member.nickname}
                  {member.isCurrentUser ? " (You)" : ""}
                </p>
                <Badge className="bg-white/70">
                  {member.role === "spectator"
                    ? "Spectator"
                    : member.role === "host"
                      ? `Host • seat ${member.seatIndex}`
                      : `Player • seat ${member.seatIndex}`}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                {member.connected ? "Connected" : "Reconnecting"}
                {member.queuedForNextGame ? " • queued next" : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
                  member.ready
                    ? "bg-[rgba(46,159,151,0.16)] text-[color:var(--color-teal)]"
                    : member.role === "spectator"
                      ? "bg-[rgba(53,90,216,0.12)] text-[color:var(--color-cobalt)]"
                      : "bg-[rgba(23,34,53,0.08)] text-[color:var(--color-muted)]",
                )}
              >
                {member.ready ? "Ready" : member.role === "spectator" ? "Watching" : "Not ready"}
              </span>
              {snapshot.isHost && !member.isCurrentUser ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onModerate?.(member.id, false)}>
                    Kick
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onModerate?.(member.id, true)}>
                    Ban
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {snapshot.viewerRole !== "spectator" && snapshot.status === "lobby" ? (
        <Button variant="secondary" fullWidth onClick={onToggleReady} disabled={submitting === "ready"}>
          {submitting === "ready" ? "Updating..." : "Toggle ready"}
        </Button>
      ) : null}
      {snapshot.isHost ? (
        <Button fullWidth onClick={onStart} disabled={submitting === "start" || snapshot.status === "live"}>
          <Play className="h-4 w-4" />
          {snapshot.status === "reveal" ? "Start next game" : "Launch game"}
        </Button>
      ) : null}
      {snapshot.viewerRole === "spectator" && snapshot.status !== "lobby" ? (
        <Button variant="ghost" fullWidth onClick={onQueueNextGame} disabled={submitting === "queue"}>
          {submitting === "queue" ? "Updating..." : "Queue for next game"}
        </Button>
      ) : null}
    </Card>
  );
}
