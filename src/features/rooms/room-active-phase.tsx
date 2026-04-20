"use client";

import { useDeferredValue, useMemo } from "react";
import { Search, Sparkles, TestTube2 } from "lucide-react";
import type { PromptRecord, RoomSnapshot, ViewerTask } from "@/features/game/types";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { HtmlPreviewPanel } from "@/components/editor/html-preview-panel";
import {
  getLanguageLabel,
  getGameModeLabel,
  getSkillModeConfig,
  getStepLabel,
  isCodeLikeStep,
  validateSnippet,
} from "@/features/game/logic";
import { searchPrompts } from "@/features/prompts/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FieldHint, FieldLabel } from "@/components/ui/field";
import { HandoffStrip } from "@/components/ui/handoff-strip";
import { Input } from "@/components/ui/input";
import { SelectableChip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/textarea";
import { ReadonlyCode } from "@/features/rooms/room-shared";
import { cn } from "@/lib/utils";

const PROMPT_CHAR_LIMIT = 180;
const TEXT_CHAR_LIMIT = 280;

function buildRoundStrip(snapshot: RoomSnapshot) {
  const sequence = snapshot.game?.roundSequence ?? ["prompt", "code", "guess"];
  return sequence.map((step, index) => ({
    label: index === 0 ? "Start" : `${index}. ${getStepLabel(step)}`,
    hint:
      index === snapshot.game?.roundIndex
        ? "live now"
        : index < (snapshot.game?.roundIndex ?? 0)
          ? "locked"
          : "waiting",
  }));
}

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
      difficulty:
        promptDifficulty === "all"
          ? snapshot.settings.skillMode
          : promptDifficulty,
      pack: promptPack === "all" ? undefined : promptPack,
    }).slice(0, 24);
  }, [
    deferredSearch,
    promptDifficulty,
    promptLibrary,
    promptPack,
    snapshot.settings.skillMode,
  ]);

  const isCodeTurn = Boolean(task && isCodeLikeStep(task.expectedStepType));
  const isPromptTurn = task?.expectedStepType === "prompt";
  const draftCharCount = draft.length;
  const promptRemaining = PROMPT_CHAR_LIMIT - draftCharCount;
  const textRemaining = TEXT_CHAR_LIMIT - draftCharCount;
  const codeMetrics =
    task && isCodeTurn
      ? validateSnippet(draft, {
          lineLimit: skillConfig.lineLimit,
          charLimit: skillConfig.charLimit,
        })
      : null;
  const isDraftValid =
    task && isCodeTurn
      ? Boolean(codeMetrics?.isValid)
      : task?.expectedStepType === "prompt"
        ? draftCharCount <= PROMPT_CHAR_LIMIT
        : draftCharCount <= TEXT_CHAR_LIMIT;
  const isSubmitDisabled =
    submitting === "submit" || draft.trim().length === 0 || !isDraftValid;
  const roundStrip = buildRoundStrip(snapshot);
  const submissionStateLabel = task?.currentSubmission
    ? "submitted"
    : draft.trim().length > 0
      ? "autosaved"
      : "empty";

  const editorNotes =
    task && isCodeTurn
      ? [
          "# Relay turn notes",
          `phase: ${snapshot.game?.phase ?? "code"}`,
          `task: ${task.submissionLabel}`,
          `language: ${getLanguageLabel(task.language)}`,
          task.runEnabled
            ? "// Run the active file if you want a quick check before lock-in."
            : "// Runtime is off or unavailable for this turn.",
        ]
      : undefined;

  const editorSettings =
    task && isCodeTurn
      ? [
          "{",
          `  "roomCode": "${snapshot.code}",`,
          `  "roundIndex": ${snapshot.game?.roundIndex ?? 0},`,
          `  "language": "${task.language ?? "javascript"}",`,
          `  "runtimeEnabled": ${task.runEnabled ? "true" : "false"},`,
          `  "lineLimit": ${skillConfig.lineLimit},`,
          `  "charLimit": ${skillConfig.charLimit}`,
          "}",
        ]
      : undefined;

  return (
    <section className="grid gap-6">
      <Card className={cn("min-w-0 space-y-5", isCodeTurn ? "p-4 sm:p-5" : "space-y-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{task?.roundLabel ?? "Spectating"}</Badge>
              {task?.language ? <Badge>{getLanguageLabel(task.language)}</Badge> : null}
              {snapshot.experience ? <Badge>{getGameModeLabel(snapshot.experience.gameMode)}</Badge> : null}
            </div>
            <div>
              <CardTitle className={cn("text-2xl sm:text-3xl", isCodeTurn && "text-xl sm:text-2xl")}>
                {task?.taskTitle ?? "Watching the room"}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base leading-7">
                {task?.helperText ??
                  "The room is live. Spectators can watch the round and queue for the next game after reveal."}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{skillConfig.timerSeconds}s</Badge>
            <Badge>{snapshot.game?.roundIndex ?? 0}/{snapshot.game?.totalRounds ?? 0} rounds</Badge>
            <Badge>{submissionStateLabel}</Badge>
          </div>
        </div>

        {snapshot.game ? (
          <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
            <HandoffStrip items={roundStrip} activeIndex={snapshot.game.roundIndex} />
          </div>
        ) : null}

        {task?.previousStep ? (
          <div className="stack-panel space-y-3 px-5 py-5">
            <div className="space-y-2">
              <FieldLabel>{task.sourceLabel}</FieldLabel>
              <p className="text-sm text-[color:var(--color-text-muted)]">{task.sourceHint}</p>
            </div>
            {task.previousStep.stepType === "code" ||
            task.previousStep.stepType === "rebuild" ||
            task.previousStep.stepType === "fix" ? (
              <ReadonlyCode
                value={task.previousStep.text}
                language={task.previousStep.language}
                allowPreview={false}
                height={230}
              />
            ) : (
              <div className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
                <p className="text-base leading-8 text-[color:var(--color-text)] sm:text-lg">
                  {task.previousStep.text}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {task ? (
          isCodeTurn ? (
            <div className="space-y-4">
              <MonacoCodeEditor
                value={draft}
                language={task.language ?? "javascript"}
                onChange={setDraft}
                height={560}
                panelHeight={240}
                workspaceLabel={snapshot.code.toLowerCase()}
                notesLines={editorNotes}
                settingsLines={editorSettings}
                toolsLines={[
                  "Only the active code file is submitted.",
                  "Run, inspect output, then lock it in.",
                  "Scratch files stay local to this browser session.",
                ]}
                panel={({ activeFile, canRun }) => (
                  <HtmlPreviewPanel
                    snippet={canRun ? activeFile.content : ""}
                    language={canRun ? (task.language ?? "html_css_js") : null}
                    fileLabel={activeFile.label}
                    autoRun={false}
                    height={240}
                    embedded
                  />
                )}
                panelPosition="bottom"
                footer={({ activeFile, canRun }) => (
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
                      {canRun ? `run target / ${activeFile.label}` : `${activeFile.label} / no runtime`}
                    </span>
                  </div>
                )}
              />
              <div className="flex flex-col gap-3 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{task.submissionLabel}</Badge>
                    <Badge>{task.runEnabled ? "Runtime on" : "Text only"}</Badge>
                    <Badge>{codeMetrics?.lineCount ?? 0}/{skillConfig.lineLimit} lines</Badge>
                  </div>
                  <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
                    {codeMetrics?.isValid
                      ? task.runEnabled
                        ? "Run it if you want, then pass it forward."
                        : "This one is ready to pass forward."
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
                    ? "Passing..."
                    : codeMetrics?.isValid
                      ? "Pass this code on"
                      : "Trim the snippet to fit"}
                </Button>
              </div>
            </div>
          ) : isPromptTurn ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              <div className="stack-panel relay-ambient space-y-4 px-5 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Starter prompt</Badge>
                  <Badge>{submissionStateLabel}</Badge>
                </div>
                <div>
                  <FieldLabel className="text-[color:var(--color-text-soft)]">
                    {task.submissionLabel}
                  </FieldLabel>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
                    {task.sourceHint}
                  </p>
                </div>
                <Textarea
                  minRows={7}
                  className="min-h-[240px] text-base leading-8"
                  placeholder={task.submissionPlaceholder}
                  value={draft}
                  onChange={(event) => {
                    setSelectedPromptId(null);
                    setDraft(event.target.value);
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FieldHint>Keep it short enough that the next dev can accidentally ruin it.</FieldHint>
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
                <Button fullWidth size="lg" onClick={onSubmit} disabled={isSubmitDisabled}>
                  {submitting === "submit" ? "Passing..." : "Start this chain"}
                </Button>
              </div>

              <div className="stack-panel relay-ambient space-y-4 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>Prompt library</Badge>
                      <Badge>{promptResults.length} matches</Badge>
                    </div>
                    <FieldLabel className="mt-3 text-[color:var(--color-text-soft)]">
                      Grab a starter fast
                    </FieldLabel>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
                      Search the library, filter the vibe, or hit random and live with it.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onRandomPrompt}>
                    <Sparkles className="h-4 w-4" />
                    Random
                  </Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div className="space-y-2">
                    <FieldLabel>Search</FieldLabel>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
                      <Input
                        className="pl-10"
                        placeholder="boss, ui, toy..."
                        value={promptSearch}
                        onChange={(event) => setPromptSearch(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "beginner", label: "Beginner" },
                      { value: "intermediate", label: "Intermediate" },
                      { value: "advanced", label: "Advanced" },
                      { value: "chaos", label: "Chaos" },
                    ].map((option) => (
                      <SelectableChip
                        key={option.value}
                        selected={promptDifficulty === option.value}
                        label={option.label}
                        onClick={() =>
                          setPromptDifficulty(option.value as "all" | PromptRecord["difficulty"])
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="flex max-h-[116px] flex-wrap gap-2 overflow-auto pr-1">
                  <SelectableChip
                    selected={promptPack === "all"}
                    label="All packs"
                    onClick={() => setPromptPack("all")}
                  />
                  {promptPacks.map((pack) => (
                    <SelectableChip
                      key={pack.value}
                      selected={promptPack === pack.value}
                      label={pack.label}
                      onClick={() => setPromptPack(pack.value)}
                    />
                  ))}
                </div>
                <div className="max-h-[420px] overflow-auto pr-1">
                  <div className="grid gap-3 md:grid-cols-2">
                    {promptResults.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        className={cn(
                          "flex h-full flex-col justify-between rounded-[14px] border px-4 py-4 text-left transition",
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
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                            {prompt.packLabel}
                          </span>
                          <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                            /
                          </span>
                          <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                            {prompt.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <Textarea
                  minRows={8}
                  className="min-h-[250px] text-base leading-8"
                  placeholder={task.submissionPlaceholder}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-3">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      textRemaining >= 0
                        ? "text-[color:var(--color-accent-hover)]"
                        : "text-[color:var(--color-danger)]",
                    )}
                  >
                    {Math.max(textRemaining, 0)} characters remaining
                  </span>
                  <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                    {task.submissionLabel}
                  </span>
                </div>
                <Button fullWidth size="lg" onClick={onSubmit} disabled={isSubmitDisabled}>
                  {submitting === "submit" ? "Passing..." : `Pass this ${getStepLabel(task.expectedStepType).toLowerCase()} on`}
                </Button>
              </div>
              <div className="space-y-4">
                <div className="stack-panel space-y-3 px-5 py-5">
                  <FieldLabel className="text-[color:var(--color-text-soft)]">
                    This step
                  </FieldLabel>
                  <p className="text-sm leading-7 text-[color:var(--color-text-muted)]">
                    {task.helperText}
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
                    You only get the last visible step. The room does not see the full chain until reveal.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="stack-panel px-5 py-5">
            <p className="text-base leading-8 text-[color:var(--color-text)]">
              Spectators can watch the room update live and queue for the next game once this match wraps.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
