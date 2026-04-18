"use client";

import { useState } from "react";
import { Clock3, Copy, Eye, Play, TestTube2, Users } from "lucide-react";
import type { CodeLanguage, RoomSnapshot } from "@/features/game/types";
import {
  canRunPreviewLanguage,
  getRoundLabel,
  getSkillModeConfig,
} from "@/features/game/logic";
import { HtmlPreviewPanel } from "@/components/editor/html-preview-panel";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { HandoffStrip } from "@/components/ui/handoff-strip";
import { cn } from "@/lib/utils";

function getRoomPhaseIndex(snapshot: RoomSnapshot) {
  if (snapshot.status === "lobby" || !snapshot.game) {
    return 0;
  }

  if (snapshot.game.phase === "reveal" || snapshot.game.phase === "summary") {
    return 3;
  }

  if (snapshot.game.phase === "description") {
    return 2;
  }

  return 1;
}

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

  const canPreview = allowPreview && canRunPreviewLanguage(language);

  return (
    <div className="space-y-3">
      <MonacoCodeEditor
        value={value}
        language={language}
        readOnly
        height={height}
        notesLines={[
          "# Relay viewer notes",
          `language: ${language}`,
          "// Read-only view. Use preview if this snippet supports the browser sandbox.",
        ]}
        settingsLines={[
          "{",
          `  "language": "${language}",`,
          `  "readOnly": true,`,
          `  "previewEnabled": ${canPreview ? "true" : "false"}`,
          "}",
        ]}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              read-only viewer
            </span>
            {canPreview ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#2d2d30] bg-[#161b22] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#9da7b3] transition hover:text-[#e6edf3]"
                onClick={() => setPreviewOpen((current) => !current)}
              >
                <Eye className="h-3.5 w-3.5" />
                {previewOpen ? "Hide preview" : "Preview"}
              </button>
            ) : null}
          </div>
        }
      />
      {previewOpen ? (
        <HtmlPreviewPanel
          snippet={value}
          language={language}
          height={260}
          autoRun
        />
      ) : null}
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
      <div className="hero-grid relay-ambient relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        <div className="relative space-y-4">
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
            {snapshot.isDemo ? <Badge>Demo</Badge> : null}
            {timeRemaining !== null ? (
              <Badge>
                <Clock3 className="h-3.5 w-3.5" />
                {timeRemaining}s left
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
            <div className="space-y-4">
              <h1 className="font-display text-3xl tracking-[-0.05em] text-[color:var(--color-text-strong)] sm:text-[2.6rem]">
                {snapshot.roomName}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-text-soft)] sm:text-base">
                {snapshot.status === "lobby"
                  ? "Set the room, watch the roster, and launch when everyone is ready."
                  : snapshot.game?.phase === "reveal"
                    ? "The full chain is finally visible. React, favorite the best breaks, and pass the replay around."
                    : "Players only see the previous step. The full chain stays hidden until reveal."}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="surface-pill inline-flex items-center gap-2 rounded-[12px] px-3 py-2">
                  <span className="label-mono text-[color:var(--color-text-muted)]">code</span>
                  <span className="font-mono text-base font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-strong)]">
                    {snapshot.code}
                  </span>
                </div>
                <div className="surface-pill inline-flex items-center gap-2 rounded-[12px] px-3 py-2">
                  <span className="label-mono text-[color:var(--color-text-muted)]">players</span>
                  <span className="font-semibold text-[color:var(--color-text-strong)]">
                    {snapshot.members.filter((member) => member.role !== "spectator").length}
                  </span>
                </div>
                <div className="surface-pill inline-flex items-center gap-2 rounded-[12px] px-3 py-2">
                  <span className="label-mono text-[color:var(--color-text-muted)]">phase</span>
                  <span className="font-semibold capitalize text-[color:var(--color-text-strong)]">
                    {snapshot.status === "lobby" ? "Setup" : snapshot.game?.phase ?? "Live"}
                  </span>
                </div>
              </div>
              <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
                <HandoffStrip
                  items={[
                    { label: "Lobby", hint: "Room gets set." },
                    { label: "Build", hint: "Someone writes the next move." },
                    { label: "Pass", hint: "Another dev misreads it." },
                    { label: "Reveal", hint: "The whole chain opens up." },
                  ]}
                  activeIndex={getRoomPhaseIndex(snapshot)}
                />
              </div>
            </div>
            <div className="stack-panel space-y-4 px-4 py-4">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                  Room pressure
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-soft)]">
                  {snapshot.status === "lobby"
                    ? "Get the roster ready, lock the vibe, and kick it off."
                    : snapshot.game?.phase === "reveal" || snapshot.game?.phase === "summary"
                      ? "Damage report is open. Pass the replay around once the room picks favorites."
                      : "The baton is moving. Every player only sees one step at a time."}
                </p>
              </div>
              <div className="relay-divider" />
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
          <CardTitle>Players</CardTitle>
          <CardDescription>
            {activePlayers} active / {spectators} spectating
          </CardDescription>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] text-[color:var(--color-accent-hover)]">
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
                <p className="truncate text-base font-semibold text-[color:var(--color-text-strong)]">
                  {member.nickname}
                  {member.isCurrentUser ? " (you)" : ""}
                </p>
                <Badge className="bg-[color:var(--color-bg-main)]">
                  {member.role === "spectator"
                    ? "spectator"
                    : member.role === "host"
                      ? `host / seat ${member.seatIndex}`
                      : `player / seat ${member.seatIndex}`}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {member.connected ? "Connected" : "Reconnecting"}
                {member.queuedForNextGame ? " / queued next" : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-[999px] border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em]",
                  member.ready
                    ? "border-[rgba(46,160,67,0.35)] bg-[rgba(46,160,67,0.12)] text-[color:var(--color-success)]"
                    : member.role === "spectator"
                      ? "border-[rgba(0,122,204,0.35)] bg-[rgba(0,122,204,0.12)] text-[color:var(--color-accent-hover)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] text-[color:var(--color-text-muted)]",
                )}
              >
                {member.ready ? "ready" : member.role === "spectator" ? "watching" : "not ready"}
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
          {snapshot.isDemo ? <TestTube2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
