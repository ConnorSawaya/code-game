"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Users } from "lucide-react";
import type { PublicRoomSummary } from "@/features/game/types";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { usePersistedNickname } from "@/features/auth/use-persisted-nickname";
import { postJson } from "@/lib/client-api";
import { toast } from "sonner";
import { getSkillModeConfig } from "@/features/game/logic";

function getRoomStateTone(status: PublicRoomSummary["status"]) {
  switch (status) {
    case "lobby":
      return "border-[rgba(24,144,241,0.28)] bg-[rgba(24,144,241,0.12)] text-[#78bfff]";
    case "reveal":
      return "border-[rgba(210,153,34,0.35)] bg-[rgba(210,153,34,0.12)] text-[#f4d27d]";
    case "live":
    default:
      return "border-[rgba(46,160,67,0.35)] bg-[rgba(46,160,67,0.12)] text-[#9fddb1]";
  }
}

export function PublicRoomsBoard({
  rooms,
}: {
  rooms: PublicRoomSummary[];
}) {
  const router = useRouter();
  const { demoMode } = useDemoMode();
  const { nickname, setNickname } = usePersistedNickname("late-night-dev");
  const [skillMode, setSkillMode] = useState<"all" | PublicRoomSummary["skillMode"]>("all");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => skillMode === "all" || room.skillMode === skillMode);
  }, [rooms, skillMode]);

  const joinPublicRoom = async (code: string) => {
    if (nickname.trim().length < 2) {
      toast.error("Pick a nickname before joining.");
      return;
    }

    try {
      setJoiningCode(code);
      const result = await postJson<{ room_code: string }>("/api/rooms/join", {
        roomCode: code,
        nickname,
        turnstileToken,
        demoMode,
      });
      startTransition(() => {
        router.push(`/room/${result.room_code}`);
        router.refresh();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to join room.");
    } finally {
      setJoiningCode(null);
    }
  };

  return (
    <div className="section-grid">
      <section className="grid gap-5 xl:grid-cols-[0.84fr_1.16fr]">
        <Card className="space-y-5">
          <Badge>Public Rooms</Badge>
          <div>
            <CardTitle>Open rooms.</CardTitle>
            <CardDescription className="mt-2">
              Join a lobby or watch one live.
            </CardDescription>
          </div>
          <Field>
            <FieldLabel>Nickname</FieldLabel>
            <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Skill filter</FieldLabel>
            <SegmentedControl
              value={skillMode}
              onChange={setSkillMode}
              options={[
                { value: "all", label: "All" },
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
                { value: "chaos", label: "Chaos" },
              ]}
            />
          </Field>
          <TurnstileWidget onToken={setTurnstileToken} />
          <div className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4 text-sm text-[color:var(--color-text-muted)]">
            {filteredRooms.length === 0
              ? "No rooms match that filter right now."
              : `${filteredRooms.length} room${filteredRooms.length === 1 ? "" : "s"} visible.`}
          </div>
        </Card>

        <Card className="space-y-4">
          {filteredRooms.length === 0 ? (
            <div className="stack-panel px-5 py-6">
              <p className="font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                No rooms match that filter yet.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
                Quick Play can spin up a new public lobby instantly if you want to kick one off.
              </p>
            </div>
          ) : null}

          {filteredRooms.map((room) => (
            <div key={room.id} className="stack-panel relay-ambient overflow-hidden">
              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[1.6rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-strong)] sm:text-[1.9rem]">
                        {room.code}
                      </p>
                      <p className="mt-2 text-base font-semibold text-[color:var(--color-text-strong)]">
                        {room.hostNickname}&apos;s room
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] ${getRoomStateTone(room.status)}`}
                    >
                      <span className="status-dot bg-current" />
                      {room.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{getSkillModeConfig(room.skillMode).label}</Badge>
                    <Badge>{room.id.startsWith("demo-") ? "Demo flow" : "Public room"}</Badge>
                  </div>
                  <CardDescription className="max-w-2xl">
                    {room.status === "lobby"
                      ? "Open lobby."
                      : room.status === "live"
                        ? "Live now."
                        : "Reveal in progress."}
                  </CardDescription>
                  <div className="flex flex-wrap gap-3 text-sm text-[color:var(--color-text-soft)]">
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-[color:var(--color-accent-hover)]" />
                      {room.id.startsWith("demo-")
                        ? "demo room"
                        : `${room.playerCount} players / ${room.seatsOpen} open`}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[color:var(--color-warning)]" />
                      {room.id.startsWith("demo-")
                        ? "testing flow"
                        : `${room.spectatorCount} spectating`}
                    </span>
                    {!room.id.startsWith("demo-") ? (
                      <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                        {room.playerCount}/{room.playerCount + room.seatsOpen} seats filled
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 lg:min-w-[180px]">
                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => void joinPublicRoom(room.code)}
                    disabled={joiningCode === room.code}
                  >
                    {joiningCode === room.code
                      ? "Opening..."
                      : room.status === "lobby"
                        ? "Join room"
                      : "Watch room"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
