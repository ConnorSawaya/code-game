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
      <Card className="space-y-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Reveal stage</Badge>
              {snapshot.isDemo ? <Badge>Demo replay</Badge> : null}
            </div>
            <CardTitle className="mt-3">Watch the whole chain collapse in public.</CardTitle>
            <CardDescription className="mt-2">
              React to every jump, vote for the best break in the chain, and open the replay once the room picks favorites.
            </CardDescription>
          </div>
          {snapshot.game?.replaySlug ? (
            <Button variant="secondary" onClick={onOpenReplay}>
              Open replay page
            </Button>
          ) : null}
        </div>

        <div className="space-y-5">
          {snapshot.game?.chains.map((chain, chainIndex) => (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: chainIndex * 0.06 }}
              className="stack-panel overflow-hidden"
            >
              <div className="border-b border-[color:var(--color-border)] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="label-mono text-[color:var(--color-text-muted)]">
                      Chain {chain.originSeatIndex + 1}
                    </p>
                    <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                      Started by{" "}
                      {snapshot.members.find((member) => member.id === chain.originMemberId)?.nickname ??
                        "Unknown"}
                    </p>
                  </div>
                  <Badge>{chain.steps.length} steps</Badge>
                </div>
              </div>
              <div className="grid gap-4 px-5 py-5">
                {chain.steps.map((step) => (
                  <div key={step.id} className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{getRoundLabel(step.roundIndex)}</Badge>
                      {step.language ? <Badge>{getLanguageLabel(step.language)}</Badge> : null}
                      {step.fallback ? <Badge>Fallback</Badge> : null}
                    </div>
                    <div className="mt-4">
                      {step.stepType === "code" ? (
                        <ReadonlyCode value={step.text} language={step.language} height={240} />
                      ) : (
                        <p className="text-base leading-8 text-[color:var(--color-text)] sm:text-lg">
                          {step.text}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {reactionEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-[999px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 py-2 text-sm font-semibold transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-strong)]"
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
