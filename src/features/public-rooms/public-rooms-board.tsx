"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Users, UserRoundPlus } from "lucide-react";
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
  const allSeededDemoRooms =
    filteredRooms.length > 0 && filteredRooms.every((room) => room.id.startsWith("demo-"));

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
            <CardTitle>Browse the rooms already making noise.</CardTitle>
            <CardDescription className="mt-2">
              Join an open lobby, watch a live match, or use demo mode to check the spectator and reveal states quickly.
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
          {allSeededDemoRooms ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="stack-panel px-4 py-4">
                <p className="label-mono text-[color:var(--color-text-muted)]">Mode</p>
                <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                  Demo
                </p>
              </div>
              <div className="stack-panel px-4 py-4">
                <p className="label-mono text-[color:var(--color-text-muted)]">Listings</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-text)]">
                  Seeded rooms for testing flows, not live traffic numbers.
                </p>
              </div>
              <div className="stack-panel px-4 py-4">
                <p className="label-mono text-[color:var(--color-text-muted)]">Use it for</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-text)]">
                  Join, spectate, reveal, and replay checks without fake aggregate stats.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="stack-panel px-4 py-4">
                <p className="label-mono text-[color:var(--color-text-muted)]">Open rooms</p>
                <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                  {filteredRooms.length}
                </p>
              </div>
              <div className="stack-panel px-4 py-4">
                <p className="label-mono text-[color:var(--color-text-muted)]">Active players</p>
                <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                  {filteredRooms.reduce((total, room) => total + room.playerCount, 0)}
                </p>
              </div>
              <div className="stack-panel px-4 py-4">
                <p className="label-mono text-[color:var(--color-text-muted)]">Spectators</p>
                <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                  {filteredRooms.reduce((total, room) => total + room.spectatorCount, 0)}
                </p>
              </div>
            </div>
          )}
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
            <div key={room.id} className="stack-panel overflow-hidden">
              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{room.code}</Badge>
                    <Badge>{getSkillModeConfig(room.skillMode).label}</Badge>
                    <Badge>{room.status}</Badge>
                  </div>
                  <div>
                    <CardTitle>{room.hostNickname}&apos;s room</CardTitle>
                    <CardDescription className="mt-2">
                      {room.status === "lobby"
                        ? "Open lobby with enough breathing room to hop in before prompt one."
                        : room.status === "live"
                          ? "Game is already moving. Spectate now, then queue for the next one."
                          : "Reveal is underway. Good timing if you only want the funniest part."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[color:var(--color-text-soft)]">
                    {room.id.startsWith("demo-") ? (
                      <>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <Users className="h-4 w-4 text-[color:var(--color-accent-hover)]" />
                          Seeded demo room
                        </span>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <Eye className="h-4 w-4 text-[color:var(--color-warning)]" />
                          Testing flow only
                        </span>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <UserRoundPlus className="h-4 w-4 text-[color:var(--color-success)]" />
                          No fake headcount
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <Users className="h-4 w-4 text-[color:var(--color-accent-hover)]" />
                          {room.playerCount} players
                        </span>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <Eye className="h-4 w-4 text-[color:var(--color-warning)]" />
                          {room.spectatorCount} spectators
                        </span>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <UserRoundPlus className="h-4 w-4 text-[color:var(--color-success)]" />
                          {room.seatsOpen} seats open
                        </span>
                      </>
                    )}
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
                  <p className="text-center font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                    {room.status === "lobby" ? "ready to enter" : "spectate and queue"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
