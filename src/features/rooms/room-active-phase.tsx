"use client";

import { useDeferredValue, useMemo } from "react";
import { Search, Sparkles, TestTube2, Wand2 } from "lucide-react";
import type { PromptRecord, RoomSnapshot, ViewerTask } from "@/features/game/types";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { HtmlPreviewPanel } from "@/components/editor/html-preview-panel";
import {
  canRunPreviewLanguage,
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
  const canPreviewCurrentLanguage = canRunPreviewLanguage(task?.language ?? null);

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

  const draftCharCount = draft.length;
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
  const isCodeTurn = task?.expectedStepType === "code";
  const taskPanelLabel = task
    ? task.expectedStepType === "code"
      ? "Your prompt"
      : task.expectedStepType === "description"
        ? "Code to describe"
        : "Previous step"
    : "Current step";
  const taskPanelHint = task
    ? task.expectedStepType === "code"
      ? "Write code for this step."
      : task.expectedStepType === "description"
        ? "Describe what this code seems to do."
        : null
    : null;

  const phaseLabel = task
    ? task.expectedStepType === "prompt"
      ? "Starter prompt"
      : task.expectedStepType === "code"
        ? "Code round"
        : "Description round"
      : "Spectating";

  const editorNotes =
    task?.expectedStepType === "code"
      ? [
          "# Relay turn notes",
          `phase: ${snapshot.game?.phase ?? "code"}`,
          `language: ${getLanguageLabel(task.language)}`,
          task.previousStep
            ? `previous_step: ${task.previousStep.stepType}`
            : "previous_step: prompt",
          canPreviewCurrentLanguage
            ? "// Use Run code if you want a quick sandbox check."
            : "// This language stays text-only for now.",
        ]
      : undefined;

  const editorSettings =
    task?.expectedStepType === "code"
      ? [
          "{",
          `  "roomCode": "${snapshot.code}",`,
          `  "phase": "${snapshot.game?.phase ?? "code"}",`,
          `  "roundIndex": ${snapshot.game?.roundIndex ?? 0},`,
          `  "language": "${task.language ?? "javascript"}",`,
          `  "lineLimit": ${skillConfig.lineLimit},`,
          `  "charLimit": ${skillConfig.charLimit},`,
          `  "timerSeconds": ${skillConfig.timerSeconds}`,
          "}",
        ]
      : undefined;

  return (
    <section
      className={cn(
        "grid gap-6",
        isCodeTurn ? "grid-cols-1" : "2xl:grid-cols-[minmax(0,1fr)_300px]",
      )}
    >
      <Card className={cn("min-w-0", isCodeTurn ? "space-y-4 p-4 sm:p-5" : "space-y-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{phaseLabel}</Badge>
              {task?.language ? <Badge>{getLanguageLabel(task.language)}</Badge> : null}
            </div>
            <div>
              <CardTitle className={cn("text-2xl sm:text-3xl", isCodeTurn && "text-xl sm:text-2xl")}>
                {task
                  ? task.expectedStepType === "prompt"
                    ? "Seed the first bad idea"
                    : task.expectedStepType === "code"
                      ? `${getLanguageLabel(task.language)} round`
                      : "Describe what the last dev meant"
                  : "You are spectating this turn"}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                {task
                  ? task.expectedStepType === "prompt"
                    ? "Use a custom opener or steal one from the built-in packs."
                    : task.expectedStepType === "code"
                      ? "Write one clear step, preview it if you want, then send it on."
                      : "Focus on visible behavior, not implementation details. The next player only gets your description."
                  : "Live rounds stay visible here, and spectators can queue for the next lobby after the match ends."}
              </CardDescription>
            </div>
          </div>
        </div>

        {isCodeTurn ? (
          <div className="flex flex-wrap gap-2">
            <Badge>{skillConfig.timerSeconds}s timer</Badge>
            <Badge>{skillConfig.lineLimit} lines</Badge>
            <Badge>{skillConfig.charLimit} chars</Badge>
          </div>
        ) : null}

        {task?.previousStep ? (
          <div className="stack-panel space-y-3 px-5 py-5">
            <div className="space-y-2">
              <FieldLabel>{taskPanelLabel}</FieldLabel>
              {taskPanelHint ? (
                <p className="text-sm text-[color:var(--color-text-muted)]">{taskPanelHint}</p>
              ) : null}
            </div>
            {task.previousStep.stepType === "code" ? (
              <ReadonlyCode
                value={task.previousStep.text}
                language={task.previousStep.language}
                allowPreview={false}
                height={230}
              />
            ) : (
              <p className="text-base leading-8 text-[color:var(--color-text)] sm:text-lg">
                {task.previousStep.text}
              </p>
            )}
          </div>
        ) : null}

        {task ? (
          <>
            {task.expectedStepType === "code" ? (
              <div className="space-y-4">
                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.7fr)_340px]">
                  <div className="space-y-4">
                    <MonacoCodeEditor
                      value={draft}
                      language={task.language ?? "javascript"}
                      onChange={setDraft}
                      height={640}
                      notesLines={editorNotes}
                      settingsLines={editorSettings}
                      toolsLines={[
                        "Explorer follows the active file language.",
                        canPreviewCurrentLanguage
                          ? "Use Run code before you submit if you want a quick check."
                          : "This language stays text-only for now.",
                        "Autosave keeps your current draft on this machine.",
                      ]}
                      footer={
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={cn(
                              "font-mono text-[0.68rem] uppercase tracking-[0.14em]",
                              codeMetrics?.isValid ? "text-[#2ea043]" : "text-[#f85149]",
                            )}
                          >
                            {codeMetrics?.lineCount ?? 0}/{skillConfig.lineLimit} lines /{" "}
                            {codeMetrics?.charCount ?? 0}/{skillConfig.charLimit} chars
                          </span>
                          <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
                            explore / notes / settings / dark+
                          </span>
                        </div>
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    {canPreviewCurrentLanguage ? (
                      <HtmlPreviewPanel
                        snippet={draft}
                        language={task.language ?? "html_css_js"}
                        autoRun={false}
                        height={640}
                      />
                    ) : (
                      <div className="stack-panel space-y-3 px-5 py-5">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-[color:var(--color-accent-hover)]" />
                          <FieldLabel className="text-[color:var(--color-text-soft)]">
                            Runtime note
                          </FieldLabel>
                        </div>
                        <p className="text-sm leading-7 text-[color:var(--color-text-muted)]">
                          This language does not have an active sandbox yet, so Relay keeps it as text only.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{codeMetrics?.lineCount ?? 0}/{skillConfig.lineLimit} lines</Badge>
                      <Badge>{codeMetrics?.charCount ?? 0}/{skillConfig.charLimit} chars</Badge>
                      <Badge>{canPreviewCurrentLanguage ? "Preview ready" : "Text only"}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
                      {codeMetrics?.isValid
                        ? canPreviewCurrentLanguage
                          ? "Use Run code in the right panel if you want a quick check."
                          : "This one is ready to send."
                        : "Trim the snippet until it fits the room limits."}
                    </p>
                  </div>
                  <Button
                    className="lg:min-w-[240px]"
                    size="lg"
                    onClick={onSubmit}
                    disabled={isSubmitDisabled}
                  >
                    {submitting === "submit"
                      ? "Submitting..."
                      : codeMetrics?.isValid
                        ? "Lock in this snippet"
                        : "Trim the snippet to fit"}
                  </Button>
                </div>
              </div>
            ) : task.expectedStepType === "description" ? (
              <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-4">
                  <Textarea
                    minRows={8}
                    className="min-h-[250px] text-base leading-8"
                    placeholder="Describe what you think this snippet is doing."
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-3">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        descriptionRemaining >= 0
                          ? "text-[color:var(--color-accent-hover)]"
                          : "text-[color:var(--color-danger)]",
                      )}
                    >
                      {Math.max(descriptionRemaining, 0)} characters remaining
                    </span>
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      keep it readable
                    </span>
                  </div>
                  <Button fullWidth size="lg" onClick={onSubmit} disabled={isSubmitDisabled}>
                    {submitting === "submit" ? "Submitting..." : "Send this description"}
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="stack-panel space-y-3 px-5 py-5">
                    <FieldLabel className="text-[color:var(--color-text-soft)]">
                      Good description energy
                    </FieldLabel>
                    <p className="text-sm leading-7 text-[color:var(--color-text-muted)]">
                      Mention the output, the behavior, and the main twist. Leave room for the next dev to improvise.
                    </p>
                  </div>
                  <div className="stack-panel space-y-3 px-5 py-5">
                    <div className="flex items-center gap-2">
                      <TestTube2 className="h-4 w-4 text-[color:var(--color-warning)]" />
                      <FieldLabel className="text-[color:var(--color-text-soft)]">
                        Relay rule
                      </FieldLabel>
                    </div>
                    <p className="text-sm leading-7 text-[color:var(--color-text-muted)]">
                      You only get the last step, never the whole chain. That is the entire trick.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-4">
                  <div className="stack-panel space-y-4 px-5 py-5">
                    <div>
                      <FieldLabel className="text-[color:var(--color-text-soft)]">
                        Custom prompt
                      </FieldLabel>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
                        Start with an app, mechanic, toy, or tiny disaster your friends can mutate.
                      </p>
                    </div>
                    <Textarea
                      minRows={6}
                      className="min-h-[220px] text-base leading-8"
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
                            ? "text-[color:var(--color-accent-hover)]"
                            : "text-[color:var(--color-danger)]",
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
                      <FieldLabel className="text-[color:var(--color-text-soft)]">
                        Prompt packs
                      </FieldLabel>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
                        Search the built-in starters, filter by vibe, or let Relay throw you something weird.
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
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
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
                          "w-full rounded-[12px] border px-4 py-3 text-left transition",
                          selectedPromptId === prompt.id
                            ? "border-[rgba(0,122,204,0.65)] bg-[rgba(0,122,204,0.18)] text-[color:var(--color-text-strong)]"
                            : "border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] text-[color:var(--color-text)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elevated)]",
                        )}
                        onClick={() => {
                          setSelectedPromptId(prompt.id);
                          setDraft(prompt.text);
                        }}
                      >
                        <p className="text-sm leading-7">{prompt.text}</p>
                        <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                          {prompt.packLabel} / {prompt.category}
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
            <p className="text-base leading-8 text-[color:var(--color-text)]">
              Spectators can watch the room update live and queue for the next game once this match wraps.
            </p>
          </div>
        )}
      </Card>

      {!isCodeTurn ? (
        <Card className="space-y-5">
          <CardTitle>Round board</CardTitle>
          <CardDescription>
            One visible step, one short turn, one chance to be understood.
          </CardDescription>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Timer</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {skillConfig.timerSeconds}s
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Lines</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {skillConfig.lineLimit}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Chars</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
                {skillConfig.charLimit}
              </p>
            </div>
          </div>
          <div className="stack-panel space-y-3 px-5 py-5">
            <FieldLabel className="text-[color:var(--color-text-soft)]">Phase reminder</FieldLabel>
            <p className="text-sm leading-7 text-[color:var(--color-text-muted)]">
              {snapshot.game?.phase === "prompt"
                ? "Every player seeds one chain with a custom prompt or a curated starter from the library."
                : snapshot.game?.phase === "code"
                  ? "Write a compact snippet. Relay is funniest when the next player can misread your intent."
                  : "Describe what the previous code seems to do in normal language, not implementation jargon."}
            </p>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
