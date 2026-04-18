"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { RoomViewData } from "@/features/rooms/queries";
import type { ChainStep, RoomSnapshot } from "@/features/game/types";
import { getLanguageLabel, getRoundLabel } from "@/features/game/logic";
import { HandoffStrip } from "@/components/ui/handoff-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ReadonlyCode } from "@/features/rooms/room-shared";
import { cn } from "@/lib/utils";

const reactionEmojis = ["🔥", "😂", "🤯", "💡", "👏"];

function getStepAuthor(snapshot: RoomSnapshot, step: ChainStep) {
  if (!step.authorMemberId) {
    return "Unknown dev";
  }

  return (
    snapshot.members.find((member) => member.id === step.authorMemberId)?.nickname ??
    "Unknown dev"
  );
}

function getStepVerb(step: ChainStep) {
  switch (step.stepType) {
    case "prompt":
      return "Started by";
    case "description":
      return "Described by";
    case "code":
    default:
      return "Written by";
  }
}

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
  const totalReactions = Object.values(reactionsByStep).reduce(
    (sum, stepReactions) =>
      sum + Object.values(stepReactions ?? {}).reduce((inner, count) => inner + count, 0),
    0,
  );
  const totalFavorites = Object.values(favoritesByStep).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <section className="section-grid">
      <Card className="hero-grid relay-ambient space-y-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Reveal stage</Badge>
              {snapshot.isDemo ? <Badge>Demo replay</Badge> : null}
            </div>
            <CardTitle className="mt-3">Open the damage report.</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              The whole chain is visible now. Follow every handoff, react to every bad turn,
              and save the moment the room really lost the plot.
            </CardDescription>
          </div>
          {snapshot.game?.replaySlug ? (
            <Button variant="secondary" onClick={onOpenReplay}>
              Open replay page
            </Button>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
            <HandoffStrip
              items={[
                { label: "Prompt", hint: "Somebody starts the problem." },
                { label: "Build", hint: "Another dev takes a swing at it." },
                { label: "Pass", hint: "Meaning drifts under pressure." },
                { label: "Reveal", hint: "Now the whole room sees the damage." },
              ]}
              activeIndex={3}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Chains</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {snapshot.game?.chains.length ?? 0}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Reactions</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {totalReactions}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Favorites</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {totalFavorites}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {snapshot.game?.chains.map((chain, chainIndex) => {
          const starter = chain.steps[0];

          return (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: chainIndex * 0.06 }}
              className="stack-panel relay-ambient overflow-hidden"
            >
              <div className="grid gap-5 border-b border-[color:var(--color-border)] px-5 py-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Chain {chain.originSeatIndex + 1}</Badge>
                    <Badge>{chain.steps.length} steps</Badge>
                  </div>
                  <div>
                    <p className="font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                      Started by{" "}
                      {snapshot.members.find((member) => member.id === chain.originMemberId)?.nickname ??
                        "Unknown"}
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--color-text-soft)]">
                      Follow the baton from the opener through every bad interpretation.
                    </p>
                  </div>
                </div>
                <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                    Started as
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--color-text)]">
                    {starter?.text ?? "No starter prompt recorded."}
                  </p>
                </div>
              </div>

              <div className="space-y-5 px-5 py-6">
                {chain.steps.map((step, index) => {
                  const author = getStepAuthor(snapshot, step);
                  const nextStep = chain.steps[index + 1];
                  const nextAuthor = nextStep ? getStepAuthor(snapshot, nextStep) : null;

                  return (
                    <div
                      key={step.id}
                      className="grid gap-4 md:grid-cols-[62px_minmax(0,1fr)]"
                    >
                      <div className="hidden md:flex md:flex-col md:items-center">
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full border font-mono text-sm font-semibold",
                            index === chain.steps.length - 1
                              ? "border-[rgba(210,153,34,0.4)] bg-[rgba(210,153,34,0.14)] text-[#f4d27d]"
                              : "border-[rgba(24,144,241,0.4)] bg-[rgba(24,144,241,0.12)] text-[#78bfff]",
                          )}
                        >
                          {index + 1}
                        </div>
                        {index < chain.steps.length - 1 ? (
                          <div className="mt-2 h-full w-px bg-[linear-gradient(180deg,rgba(24,144,241,0.55),rgba(210,153,34,0.15))]" />
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        {index > 0 ? (
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                              Handoff {index}
                            </span>
                            <div className="relay-divider flex-1" />
                            <span className="text-xs text-[color:var(--color-text-soft)]">
                              {getStepAuthor(snapshot, chain.steps[index - 1])} passed it forward
                            </span>
                          </div>
                        ) : null}

                        <div className="overflow-hidden rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)]">
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-4">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge>{getRoundLabel(step.roundIndex)}</Badge>
                                {step.language ? <Badge>{getLanguageLabel(step.language)}</Badge> : null}
                                {step.fallback ? <Badge>Fallback</Badge> : null}
                              </div>
                              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                                {getStepVerb(step)} {author}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                                {nextAuthor ? `passes to ${nextAuthor}` : "final handoff"}
                              </p>
                            </div>
                          </div>

                          <div className="px-4 py-4">
                            {step.stepType === "code" ? (
                              <ReadonlyCode value={step.text} language={step.language} height={240} />
                            ) : (
                              <p className="text-base leading-8 text-[color:var(--color-text)] sm:text-lg">
                                {step.text}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] px-4 py-4">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onFavorite(chain.id, step.id)}
                            >
                              <Sparkles className="h-4 w-4" />
                              Favorite moment ({favoritesByStep[step.id] ?? 0})
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
