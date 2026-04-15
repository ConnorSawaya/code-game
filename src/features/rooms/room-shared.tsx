"use client";

import CodeMirror from "@uiw/react-codemirror";
import { Clock3, Copy, Play, Users } from "lucide-react";
import type { CodeLanguage, RoomSnapshot } from "@/features/game/types";
import { getCodeMirrorExtensions } from "@/features/game/editor";
import { getRoundLabel, getSkillModeConfig } from "@/features/game/logic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ReadonlyCode({
  value,
  language,
}: {
  value: string;
  language: CodeLanguage | null;
}) {
  if (!language) {
    return null;
  }

  return (
    <CodeMirror
      value={value}
      height="220px"
      editable={false}
      extensions={getCodeMirrorExtensions(language)}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: false,
        foldGutter: false,
      }}
    />
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
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
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
          <Badge className="bg-[rgba(76,104,200,0.08)] text-[color:var(--color-cobalt)]">
            <Clock3 className="h-3.5 w-3.5" />
            {timeRemaining}s left
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-4xl tracking-[-0.05em]">{snapshot.roomName}</h1>
          <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-muted)]">
            {snapshot.status === "lobby"
              ? "Tune the room and ready up before the first prompt lands."
              : snapshot.game?.phase === "reveal"
                ? "The full chain is live now. React, vote, and share the replay."
                : "Only the immediately previous step is visible until reveal."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onCopyCode}>
            <Copy className="h-4 w-4" />
            Copy code
          </Button>
          {snapshot.game?.replaySlug ? (
            <Button variant="ghost" onClick={onCopyReplay}>
              <Copy className="h-4 w-4" />
              Copy replay
            </Button>
          ) : null}
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
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Room Roster</CardTitle>
          <CardDescription>
            {snapshot.members.filter((member) => member.role !== "spectator").length} active players,{" "}
            {snapshot.members.filter((member) => member.role === "spectator").length} spectators.
          </CardDescription>
        </div>
        <Users className="h-5 w-5 text-[color:var(--color-cobalt)]" />
      </div>
      <div className="space-y-3">
        {snapshot.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-[20px] bg-white/80 px-4 py-3"
          >
            <div>
              <p className="font-medium">
                {member.nickname}
                {member.isCurrentUser ? " | You" : ""}
              </p>
              <p className="text-sm text-[color:var(--color-muted)]">
                {member.role === "spectator"
                  ? "Spectator"
                  : member.role === "host"
                    ? `Host | seat ${member.seatIndex}`
                    : `Player | seat ${member.seatIndex}`}
              </p>
            </div>
            <p
              className={cn(
                "text-sm font-medium",
                member.ready ? "text-[color:var(--color-cobalt)]" : "text-[color:var(--color-muted)]",
              )}
            >
              {member.ready ? "Ready" : member.role === "spectator" ? "Watching" : "Not ready"}
            </p>
            {snapshot.isHost && !member.isCurrentUser ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onModerate?.(member.id, false)}>
                  Kick
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onModerate?.(member.id, true)}>
                  Ban
                </Button>
              </div>
            ) : null}
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
          {snapshot.status === "reveal" ? "Start next game" : "Start game"}
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
