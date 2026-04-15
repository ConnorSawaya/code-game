"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { RoomViewData } from "@/features/rooms/queries";
import type { RoomSnapshot } from "@/features/game/types";
import { getLanguageLabel, getRoundLabel } from "@/features/game/logic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ReadonlyCode } from "@/features/rooms/room-shared";

const reactionEmojis = ["🔥", "😂", "🤯", "💡", "👏"];

export function RoomReveal({
  snapshot,
  reactionsByStep,
  favoritesByStep,
  onReact,
  onFavorite,
  onOpenReplay,
}: {
  snapshot: RoomSnapshot;
  reactionsByStep: RoomViewData["reactionsByStep"];
  favoritesByStep: RoomViewData["favoritesByStep"];
  onReact: (stepId: string, emoji: string) => void;
  onFavorite: (chainId: string, stepId: string) => void;
  onOpenReplay: () => void;
}) {
  return (
    <section className="section-grid">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge>Reveal</Badge>
            <CardTitle className="mt-3">Full chain timeline</CardTitle>
            <CardDescription>
              React to steps in real time, then vote for the one moment in each chain that deserves immortality.
            </CardDescription>
          </div>
          {snapshot.game?.replaySlug ? (
            <Button variant="secondary" onClick={onOpenReplay}>
              Open replay page
            </Button>
          ) : null}
        </div>
        <div className="space-y-5">
          {snapshot.game?.chains.map((chain) => (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[30px] border border-[color:var(--color-border)] bg-white/85 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                    Chain {chain.originSeatIndex + 1}
                  </p>
                  <p className="text-base text-[color:var(--color-muted)]">
                    Started by {snapshot.members.find((member) => member.id === chain.originMemberId)?.nickname ?? "Unknown"}
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
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {reactionEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm shadow-[0_8px_16px_rgba(31,36,48,0.08)] transition hover:-translate-y-0.5"
                            onClick={() => onReact(step.id, emoji)}
                          >
                            <span>{emoji}</span>
                            <span>{reactionsByStep[step.id]?.[emoji] ?? 0}</span>
                          </button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onFavorite(chain.id, step.id)}>
                        <Sparkles className="h-4 w-4" />
                        Favorite moment ({favoritesByStep[step.id] ?? 0})
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </section>
  );
}
