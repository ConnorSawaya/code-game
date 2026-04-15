"use client";

import { useDeferredValue, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { Search, Sparkles } from "lucide-react";
import type { PromptRecord, RoomSnapshot, ViewerTask } from "@/features/game/types";
import { getCodeMirrorExtensions } from "@/features/game/editor";
import { getLanguageLabel } from "@/features/game/logic";
import { searchPrompts } from "@/features/prompts/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { ReadonlyCode } from "@/features/rooms/room-shared";
import { cn } from "@/lib/utils";

export function RoomActivePhase({
  snapshot,
  task,
  promptLibrary,
  draft,
  setDraft,
  selectedPromptId,
  setSelectedPromptId,
  promptSearch,
  setPromptSearch,
  promptDifficulty,
  setPromptDifficulty,
  promptPack,
  setPromptPack,
  onRandomPrompt,
  onSubmit,
  submitting,
}: {
  snapshot: RoomSnapshot;
  task: ViewerTask | null;
  promptLibrary: PromptRecord[];
  draft: string;
  setDraft: (value: string) => void;
  selectedPromptId: string | null;
  setSelectedPromptId: (value: string | null) => void;
  promptSearch: string;
  setPromptSearch: (value: string) => void;
  promptDifficulty: "all" | PromptRecord["difficulty"];
  setPromptDifficulty: (value: "all" | PromptRecord["difficulty"]) => void;
  promptPack: "all" | string;
  setPromptPack: (value: "all" | string) => void;
  onRandomPrompt: () => void;
  onSubmit: () => void;
  submitting: string | null;
}) {
  const deferredSearch = useDeferredValue(promptSearch);
  const promptPacks = useMemo(() => {
    const packs = new Map<string, string>();
    for (const prompt of promptLibrary) {
      if (!packs.has(prompt.pack)) {
        packs.set(prompt.pack, prompt.packLabel);
      }
    }
    return [...packs.entries()].map(([value, label]) => ({ value, label }));
  }, [promptLibrary]);

  const promptResults = useMemo(() => {
    return searchPrompts(promptLibrary, deferredSearch, {
      difficulty: promptDifficulty === "all" ? undefined : promptDifficulty,
      pack: promptPack === "all" ? undefined : promptPack,
    }).slice(0, 24);
  }, [deferredSearch, promptDifficulty, promptLibrary, promptPack]);

  const activeText = draft;
  const activeCharCount = activeText.length;
  const activeLineCount = activeText.length === 0 ? 0 : activeText.split(/\r\n|\r|\n/).length;

  return (
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge>
              {task
                ? task.expectedStepType === "prompt"
                  ? "Starter Prompt"
                  : task.expectedStepType === "code"
                    ? "Code Round"
                    : "Description Round"
                : "Spectating"}
            </Badge>
            <CardTitle className="mt-3">
              {task
                ? task.expectedStepType === "prompt"
                  ? "Start your chain"
                  : task.expectedStepType === "code"
                    ? `Write code in ${getLanguageLabel(task.language)}`
                    : "Describe what this code does"
                : "You’re spectating this round"}
            </CardTitle>
          </div>
          {task?.language ? <Badge>{getLanguageLabel(task.language)}</Badge> : null}
        </div>

        {task ? (
          <>
            {task.previousStep ? (
              <div className="space-y-3 rounded-[26px] bg-white/75 p-5">
                <FieldLabel>Previous Step</FieldLabel>
                {task.previousStep.stepType === "code"
                  ? <ReadonlyCode value={task.previousStep.text} language={task.previousStep.language} />
                  : <p className="text-lg leading-8">{task.previousStep.text}</p>}
              </div>
            ) : null}

            {task.expectedStepType === "code" ? (
              <div className="space-y-3">
                <CodeMirror
                  value={draft}
                  height="300px"
                  extensions={task.language ? getCodeMirrorExtensions(task.language) : []}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                  }}
                  onChange={(value) => setDraft(value)}
                />
                <p className="text-sm text-[color:var(--color-muted)]">
                  {activeLineCount} lines · {activeCharCount} characters
                </p>
              </div>
            ) : task.expectedStepType === "description" ? (
              <div className="space-y-3">
                <Textarea
                  minRows={6}
                  placeholder="Describe what you think this snippet is doing."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <p className="text-sm text-[color:var(--color-muted)]">{activeCharCount} / 280 characters</p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  <Field>
                    <FieldLabel>Custom Prompt</FieldLabel>
                    <Textarea
                      minRows={5}
                      placeholder="Invent a starter idea for the chain."
                      value={draft}
                      onChange={(event) => {
                        setSelectedPromptId(null);
                        setDraft(event.target.value);
                      }}
                    />
                    <FieldHint>180 characters max, or pick from the curated library.</FieldHint>
                  </Field>
                </div>
                <div className="space-y-4 rounded-[26px] bg-white/75 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <FieldLabel>Prompt Library</FieldLabel>
                      <p className="text-sm text-[color:var(--color-muted)]">
                        Search 600 built-in starters, filter by vibe, or grab a random one.
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onRandomPrompt}>
                      <Sparkles className="h-4 w-4" />
                      Random
                    </Button>
                  </div>
                  <Field>
                    <FieldLabel>Search</FieldLabel>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
                      <Input
                        className="pl-10"
                        placeholder="games, bots, cozy landing page..."
                        value={promptSearch}
                        onChange={(event) => setPromptSearch(event.target.value)}
                      />
                    </div>
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <SegmentedControl
                      value={promptDifficulty}
                      onChange={setPromptDifficulty}
                      options={[
                        { value: "all", label: "All" },
                        { value: "beginner", label: "Beginner" },
                        { value: "intermediate", label: "Intermediate" },
                        { value: "advanced", label: "Advanced" },
                        { value: "chaos", label: "Chaos" },
                      ]}
                    />
                    <SegmentedControl
                      value={promptPack}
                      onChange={setPromptPack}
                      options={[
                        { value: "all", label: "All packs" },
                        ...promptPacks.map((pack) => ({
                          value: pack.value,
                          label: pack.label,
                        })),
                      ]}
                    />
                  </div>
                  <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                    {promptResults.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        className={cn(
                          "w-full rounded-[20px] border px-4 py-3 text-left transition",
                          selectedPromptId === prompt.id
                            ? "border-transparent bg-[color:var(--color-cobalt)] text-white shadow-[0_14px_30px_rgba(76,104,200,0.18)]"
                            : "border-[color:var(--color-border)] bg-white/85 text-[color:var(--color-ink)] hover:border-[color:var(--color-cobalt)]",
                        )}
                        onClick={() => {
                          setSelectedPromptId(prompt.id);
                          setDraft(prompt.text);
                        }}
                      >
                        <p className="text-sm leading-7">{prompt.text}</p>
                        <p className={cn("mt-2 text-xs uppercase tracking-[0.14em]", selectedPromptId === prompt.id ? "text-white/70" : "text-[color:var(--color-muted)]")}>
                          {prompt.packLabel} · {prompt.category}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <Button
              fullWidth
              size="lg"
              onClick={onSubmit}
              disabled={submitting === "submit" || draft.trim().length === 0}
            >
              {submitting === "submit" ? "Submitting..." : "Submit this step"}
            </Button>
          </>
        ) : (
          <div className="rounded-[26px] bg-white/75 p-6">
            <p className="text-lg leading-8">
              Spectators can watch the room update live and join the next lobby once this match ends.
            </p>
          </div>
        )}
      </Card>

      <Card className="space-y-5">
        <CardTitle>Round Notes</CardTitle>
        <CardDescription>
          Relay only shows the immediately previous step. The full chain stays hidden until reveal.
        </CardDescription>
        <div className="rounded-[24px] bg-white/80 p-5">
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            {snapshot.game?.phase === "prompt"
              ? "Every player seeds one chain with either a custom prompt or a curated starter from the library."
              : snapshot.game?.phase === "code"
                ? "Write a compact snippet. The room’s caps are enforced by both the UI and the server."
                : "Describe what the previous code appears to do in plain English."}
          </p>
        </div>
      </Card>
    </section>
  );
}
