"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RadioTower, Users } from "lucide-react";
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
      <Card className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <Badge>Public Browser</Badge>
          <div>
            <CardTitle>Find a room already in motion.</CardTitle>
            <CardDescription>
              Browse open public lobbies, spectate live games, or queue up for the next chain without leaving the page.
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
        </div>
        <div className="grid gap-4">
          {filteredRooms.length === 0 ? (
            <div className="paper-panel rounded-[28px] p-6">
              <p className="font-display text-2xl tracking-[-0.04em]">No open rooms match that filter yet.</p>
              <p className="mt-2 text-[color:var(--color-muted)]">
                Quick Play can create one instantly if you want to kick things off.
              </p>
            </div>
          ) : null}
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{room.code}</Badge>
                    <Badge>{getSkillModeConfig(room.skillMode).label}</Badge>
                    <Badge>{room.status === "lobby" ? "Lobby" : room.status === "live" ? "Live" : "Reveal"}</Badge>
                  </div>
                  <div>
                    <CardTitle>{room.hostNickname}&apos;s room</CardTitle>
                    <CardDescription>
                      {room.status === "lobby"
                        ? "Open lobby with room to jump in immediately."
                        : room.status === "live"
                          ? "Game in progress. You can spectate and queue for the next round."
                          : "Post-game reveal is happening right now."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[color:var(--color-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {room.playerCount} players
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <RadioTower className="h-4 w-4" />
                      {room.spectatorCount} spectators
                    </span>
                    <span>{room.seatsOpen} seats open</span>
                  </div>
                </div>
                <Button
                  fullWidth
                  className="lg:w-auto"
                  onClick={() => joinPublicRoom(room.code)}
                  disabled={joiningCode === room.code}
                >
                  {joiningCode === room.code ? "Joining..." : room.status === "lobby" ? "Join room" : "Watch room"}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
