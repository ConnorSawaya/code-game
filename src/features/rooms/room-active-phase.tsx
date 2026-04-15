"use client";

import { useDeferredValue, useMemo } from "react";
import { Search, Sparkles, TimerReset, Wand2 } from "lucide-react";
import type { PromptRecord, RoomSnapshot, ViewerTask } from "@/features/game/types";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { HtmlPreviewPanel } from "@/components/editor/html-preview-panel";
import {
  getLanguageLabel,
  getSkillModeConfig,
  validateSnippet,
} from "@/features/game/logic";
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

const PROMPT_CHAR_LIMIT = 180;
const DESCRIPTION_CHAR_LIMIT = 280;

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
  const skillConfig = getSkillModeConfig(snapshot.settings.skillMode);

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

  const normalizedDraft = draft;
  const draftCharCount = normalizedDraft.length;
  const promptRemaining = PROMPT_CHAR_LIMIT - draftCharCount;
  const descriptionRemaining = DESCRIPTION_CHAR_LIMIT - draftCharCount;
  const codeMetrics =
    task?.expectedStepType === "code"
      ? validateSnippet(draft, {
          lineLimit: skillConfig.lineLimit,
          charLimit: skillConfig.charLimit,
        })
      : null;

  const isDraftValid =
    task?.expectedStepType === "code"
      ? Boolean(codeMetrics?.isValid)
      : task?.expectedStepType === "description"
        ? draftCharCount <= DESCRIPTION_CHAR_LIMIT
        : draftCharCount <= PROMPT_CHAR_LIMIT;

  const isSubmitDisabled =
    submitting === "submit" || draft.trim().length === 0 || !isDraftValid;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_0.78fr]">
      <Card className="space-y-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <Badge>
              {task
                ? task.expectedStepType === "prompt"
                  ? "Starter Prompt"
                  : task.expectedStepType === "code"
                    ? "Code Round"
                    : "Description Round"
                : "Spectating"}
            </Badge>
            <div>
              <CardTitle className="text-2xl sm:text-3xl">
                {task
                  ? task.expectedStepType === "prompt"
                    ? "Seed your chain"
                    : task.expectedStepType === "code"
                      ? `Build the next step in ${getLanguageLabel(task.language)}`
                      : "Translate the code into plain English"
                  : "You’re spectating this turn"}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                {task
                  ? task.expectedStepType === "prompt"
                    ? "Write a custom opener or grab one from the prompt packs below."
                    : task.expectedStepType === "code"
                      ? "Keep it short, snappy, and readable. Relay is at its funniest when the next player can misunderstand you."
                      : "Be concise. The next player only gets your description before they code again."
                  : "Live rounds stay visible here, and spectators can jump into the next lobby when the match ends."}
              </CardDescription>
            </div>
          </div>
          {task?.language ? <Badge>{getLanguageLabel(task.language)}</Badge> : null}
        </div>

        {task?.previousStep ? (
          <div className="stack-panel space-y-3 px-5 py-5">
            <FieldLabel>Previous Step</FieldLabel>
            {task.previousStep.stepType === "code" ? (
              <ReadonlyCode
                value={task.previousStep.text}
                language={task.previousStep.language}
                allowPreview={false}
                height={220}
              />
            ) : (
              <p className="text-base leading-8 text-[color:var(--color-ink-soft)] sm:text-lg">
                {task.previousStep.text}
              </p>
            )}
          </div>
        ) : null}

        {task ? (
          <>
            {task.expectedStepType === "code" ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <MonacoCodeEditor
                    value={draft}
                    language={task.language ?? "javascript"}
                    onChange={setDraft}
                    height={400}
                    footer={
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase tracking-[0.14em]",
                            codeMetrics?.isValid ? "text-[#7dd6c7]" : "text-[#ff9e87]",
                          )}
                        >
                          {codeMetrics?.lineCount ?? 0}/{skillConfig.lineLimit} lines •{" "}
                          {codeMetrics?.charCount ?? 0}/{skillConfig.charLimit} chars
                        </span>
                        <span className="text-xs uppercase tracking-[0.14em] text-[#8390ab]">
                          Tab-friendly • bracket match • dark theme
                        </span>
                      </div>
                    }
                  />
                  <Button fullWidth size="lg" onClick={onSubmit} disabled={isSubmitDisabled}>
                    {submitting === "submit"
                      ? "Submitting..."
                      : codeMetrics?.isValid
                        ? "Lock in this snippet"
                        : "Trim the snippet to fit the round limits"}
                  </Button>
                </div>
                <div className="space-y-4">
                  {task.language === "html_css_js" ? (
                    <HtmlPreviewPanel snippet={draft} />
                  ) : (
                    <div className="stack-panel space-y-3 px-5 py-5">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-[color:var(--color-cobalt)]" />
                        <FieldLabel className="text-[color:var(--color-ink-soft)]">
                          Code Round Tip
                        </FieldLabel>
                      </div>
                      <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                        Favor compact logic, obvious hooks, and just enough weirdness for the next description to drift off course.
                      </p>
                    </div>
                  )}
                  <div className="stack-panel space-y-3 px-5 py-5">
                    <div className="flex items-center gap-2">
                      <TimerReset className="h-4 w-4 text-[color:var(--color-coral)]" />
                      <FieldLabel className="text-[color:var(--color-ink-soft)]">
                        Round Limits
                      </FieldLabel>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-[20px] bg-white/72 px-3 py-3">
                        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                          Time
                        </p>
                        <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                          {skillConfig.timerSeconds}s
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-white/72 px-3 py-3">
                        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                          Lines
                        </p>
                        <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                          {skillConfig.lineLimit}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-white/72 px-3 py-3">
                        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                          Chars
                        </p>
                        <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                          {skillConfig.charLimit}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : task.expectedStepType === "description" ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-4">
                  <Textarea
                    minRows={8}
                    className="min-h-[240px] text-base leading-8"
                    placeholder="Describe what you think this snippet is doing."
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[color:var(--color-border)] bg-white/72 px-4 py-3">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        descriptionRemaining >= 0
                          ? "text-[color:var(--color-cobalt)]"
                          : "text-[color:var(--color-coral)]",
                      )}
                    >
                      {Math.max(descriptionRemaining, 0)} characters remaining
                    </span>
                    <span className="text-sm text-[color:var(--color-muted)]">
                      Keep it readable and brief.
                    </span>
                  </div>
                  <Button fullWidth size="lg" onClick={onSubmit} disabled={isSubmitDisabled}>
                    {submitting === "submit" ? "Submitting..." : "Send this description"}
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="stack-panel space-y-3 px-5 py-5">
                    <FieldLabel className="text-[color:var(--color-ink-soft)]">
                      Good Description Energy
                    </FieldLabel>
                    <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                      Focus on intent, visible output, and the main twist. Skip implementation details the next coder can invent differently.
                    </p>
                  </div>
                  <div className="stack-panel space-y-3 px-5 py-5">
                    <FieldLabel className="text-[color:var(--color-ink-soft)]">
                      Relay Rule
                    </FieldLabel>
                    <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                      You only get the previous step, never the full chain. That tension is what makes the reveal funny.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="stack-panel space-y-4 px-5 py-5">
                    <div>
                      <FieldLabel className="text-[color:var(--color-ink-soft)]">
                        Custom Prompt
                      </FieldLabel>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                        Start with an app, toy, visual, bot, or little disaster your friends can mutate.
                      </p>
                    </div>
                    <Textarea
                      minRows={6}
                      className="min-h-[210px] text-base leading-8"
                      placeholder="Invent a starter idea for the chain."
                      value={draft}
                      onChange={(event) => {
                        setSelectedPromptId(null);
                        setDraft(event.target.value);
                      }}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <FieldHint>180 characters max, or grab one from the packs.</FieldHint>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          promptRemaining >= 0
                            ? "text-[color:var(--color-cobalt)]"
                            : "text-[color:var(--color-coral)]",
                        )}
                      >
                        {Math.max(promptRemaining, 0)} left
                      </span>
                    </div>
                  </div>
                  <Button fullWidth size="lg" onClick={onSubmit} disabled={isSubmitDisabled}>
                    {submitting === "submit" ? "Submitting..." : "Start this chain"}
                  </Button>
                </div>
                <div className="stack-panel space-y-4 px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <FieldLabel className="text-[color:var(--color-ink-soft)]">
                        Prompt Packs
                      </FieldLabel>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                        Search 600 built-in starters, filter by vibe, or let Relay surprise you.
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
                        placeholder="games, bots, fake apps..."
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
                  <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                    {promptResults.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        className={cn(
                          "w-full rounded-[22px] border px-4 py-3 text-left transition",
                          selectedPromptId === prompt.id
                            ? "border-transparent bg-[linear-gradient(180deg,var(--color-cobalt),var(--color-cobalt-strong))] text-white shadow-[0_18px_30px_rgba(53,90,216,0.24)]"
                            : "border-[color:var(--color-border)] bg-white/88 text-[color:var(--color-ink)] hover:-translate-y-0.5 hover:border-[color:var(--color-cobalt)]",
                        )}
                        onClick={() => {
                          setSelectedPromptId(prompt.id);
                          setDraft(prompt.text);
                        }}
                      >
                        <p className="text-sm leading-7">{prompt.text}</p>
                        <p
                          className={cn(
                            "mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em]",
                            selectedPromptId === prompt.id
                              ? "text-white/72"
                              : "text-[color:var(--color-muted)]",
                          )}
                        >
                          {prompt.packLabel} • {prompt.category}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="stack-panel px-5 py-5">
            <p className="text-base leading-8 text-[color:var(--color-ink-soft)]">
              Spectators can watch the room update live and queue for the next game once this match wraps.
            </p>
          </div>
        )}
      </Card>

      <Card className="space-y-5">
        <CardTitle>Round Intel</CardTitle>
        <CardDescription>
          Relay only shows the immediately previous step. The full chain stays hidden until reveal.
        </CardDescription>
        <div className="grid grid-cols-3 gap-3">
          <div className="stack-panel px-4 py-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Timer
            </p>
            <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
              {skillConfig.timerSeconds}s
            </p>
          </div>
          <div className="stack-panel px-4 py-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Lines
            </p>
            <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
              {skillConfig.lineLimit}
            </p>
          </div>
          <div className="stack-panel px-4 py-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Chars
            </p>
            <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
              {skillConfig.charLimit}
            </p>
          </div>
        </div>
        <div className="stack-panel space-y-3 px-5 py-5">
          <FieldLabel className="text-[color:var(--color-ink-soft)]">
            Phase Reminder
          </FieldLabel>
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            {snapshot.game?.phase === "prompt"
              ? "Every player seeds one chain with either a custom prompt or a curated starter from the library."
              : snapshot.game?.phase === "code"
                ? "Write a compact snippet. Relay is funniest when the next player can misread your intent."
                : "Describe what the previous code seems to do in normal language, not implementation jargon."}
          </p>
        </div>
      </Card>
    </section>
  );
}
