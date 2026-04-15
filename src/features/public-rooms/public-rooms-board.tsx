"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RadioTower, Users, UserRoundPlus } from "lucide-react";
import type { PublicRoomSummary } from "@/features/game/types";
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
  const { nickname, setNickname } = usePersistedNickname("");
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
      <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="space-y-5">
          <Badge>Public Lobbies</Badge>
          <div>
            <CardTitle>Find a room already buzzing.</CardTitle>
            <CardDescription className="mt-2">
              Browse live lobbies, spectate active rounds, or queue up for the next game without leaving the page.
            </CardDescription>
          </div>
          <Field>
            <FieldLabel>Nickname</FieldLabel>
            <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Filter by skill</FieldLabel>
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
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Open rooms
              </p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em]">
                {filteredRooms.length}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Active players
              </p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em]">
                {filteredRooms.reduce((total, room) => total + room.playerCount, 0)}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Spectators
              </p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em]">
                {filteredRooms.reduce((total, room) => total + room.spectatorCount, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          {filteredRooms.length === 0 ? (
            <div className="stack-panel px-5 py-6">
              <p className="font-display text-2xl tracking-[-0.05em]">
                No open rooms match that filter yet.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                Quick Play can spin up a new public room instantly if you want to kick things off.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="stack-panel overflow-hidden">
                  <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{room.code}</Badge>
                        <Badge>{getSkillModeConfig(room.skillMode).label}</Badge>
                        <Badge>
                          {room.status === "lobby"
                            ? "Lobby"
                            : room.status === "live"
                              ? "Live"
                              : "Reveal"}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle>{room.hostNickname}&apos;s room</CardTitle>
                        <CardDescription className="mt-2">
                          {room.status === "lobby"
                            ? "Open lobby with enough time to hop in before the first prompt lands."
                            : room.status === "live"
                              ? "Game already rolling. You can watch now and queue for the next one."
                              : "Reveal stage is happening right now, which means the funny part has started."}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <Users className="h-4 w-4 text-[color:var(--color-cobalt)]" />
                          {room.playerCount} players
                        </span>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <RadioTower className="h-4 w-4 text-[color:var(--color-coral)]" />
                          {room.spectatorCount} spectators
                        </span>
                        <span className="surface-pill inline-flex items-center gap-2 rounded-full px-3 py-2">
                          <UserRoundPlus className="h-4 w-4 text-[color:var(--color-teal)]" />
                          {room.seatsOpen} seats open
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:min-w-[180px]">
                      <Button
                        fullWidth
                        size="lg"
                        onClick={() => joinPublicRoom(room.code)}
                        disabled={joiningCode === room.code}
                      >
                        {joiningCode === room.code
                          ? "Joining..."
                          : room.status === "lobby"
                            ? "Join room"
                            : "Watch room"}
                      </Button>
                      <p className="text-center text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                        {room.status === "lobby" ? "Ready to enter" : "Spectate and queue"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
