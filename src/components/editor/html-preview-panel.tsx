"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bug,
  Eraser,
  LoaderCircle,
  MonitorPlay,
  PlayCircle,
  RotateCcw,
  TerminalSquare,
} from "lucide-react";
import type {
  CodeLanguage,
  ExecutionResult,
  RuntimeConsoleEntry,
  RuntimeProblem,
  RuntimeStatus,
} from "@/features/game/types";
import { buildPreviewSrcDoc } from "@/features/game/editor";
import { getLanguageLabel } from "@/features/game/logic";
import { cn } from "@/lib/utils";

type RuntimeView = "preview" | "console" | "problems";

type RuntimeMessagePayload = {
  source: "relay-preview";
  sessionKey?: string;
  type: "console" | "error" | "ready";
  level?: RuntimeConsoleEntry["level"];
  message?: string;
  stack?: string;
  line?: number | null;
  column?: number | null;
  timestamp?: number;
  sourceLabel?: string | null;
};

type PreparedPreview = {
  sessionKey: string;
  srcDoc: string;
  diagnostics: RuntimeProblem[];
  runtimeLabel: string;
  runnable: boolean;
};

function formatRuntimeTime(timestamp: number | null) {
  if (!timestamp) {
    return "Never";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getProblemGuidance(
  message: string,
  language: CodeLanguage | null,
  kind: RuntimeProblem["kind"],
) {
  const lower = message.toLowerCase();

  if (kind === "compile" && language === "typescript") {
    if (lower.includes("cannot find name")) {
      return "Check the identifier spelling or declare it before this line.";
    }

    if (lower.includes("type")) {
      return "The single-file TS runner is strict enough to catch obvious type mismatches first.";
    }
  }

  if (language === "python") {
    if (lower.includes("syntaxerror")) {
      return "Look for a missing colon, bad indentation, or an unmatched bracket.";
    }

    if (lower.includes("nameerror")) {
      return "That name is being used before it exists in this snippet.";
    }
  }

  if (lower.includes("unexpected token")) {
    return "There is usually a missing bracket, quote, or comma just before the reported line.";
  }

  if (lower.includes("is not defined")) {
    return "A variable or function is being called before it is set up in this file.";
  }

  if (kind === "runtime") {
    return "Rerun after trimming the snippet down to the smallest failing case.";
  }

  return null;
}

function extractStackLocation(stack?: string | null) {
  if (!stack) {
    return { line: null, column: null };
  }

  const match = stack.match(/:(\d+):(\d+)/);
  if (!match) {
    return { line: null, column: null };
  }

  return {
    line: Number(match[1]),
    column: Number(match[2]),
  };
}

function formatTypeScriptDiagnostic(
  diagnostic: import("typescript").Diagnostic,
): RuntimeProblem {
  const messageText =
    typeof diagnostic.messageText === "string"
      ? diagnostic.messageText
      : diagnostic.messageText.messageText;

  let line: number | null = null;
  let column: number | null = null;

  if (diagnostic.file && typeof diagnostic.start === "number") {
    const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    line = position.line + 1;
    column = position.character + 1;
  }

  return {
    id: `ts-${diagnostic.code}-${line ?? "x"}-${column ?? "x"}-${messageText}`,
    kind: "compile",
    severity:
      diagnostic.category === 1
        ? "error"
        : diagnostic.category === 0
          ? "warning"
          : "warning",
    message: messageText,
    line,
    column,
    source: "TypeScript",
    guidance: getProblemGuidance(messageText, "typescript", "compile"),
  };
}

function createExecutionResult(
  targetFileLabel: string,
  targetLanguage: CodeLanguage | null,
  sessionKey: string,
  runtimeLabel: string,
  runtimeStatus: RuntimeStatus,
  resetCount: number,
): ExecutionResult {
  return {
    runtimeStatus,
    targetFileLabel,
    targetLanguage,
    startedAt: null,
    finishedAt: null,
    runTimestamp: null,
    consoleEntries: [],
    diagnostics: [],
    runtimeErrors: [],
    previewMetadata: {
      sessionKey,
      targetFileLabel,
      targetLanguage,
      runtimeLabel,
      previewKind: runtimeStatus === "no_runtime" ? "no_runtime" : "preview",
      resetCount,
    },
  };
}

function appendConsoleEntry(
  current: RuntimeConsoleEntry[],
  next: RuntimeConsoleEntry,
) {
  const previous = current[current.length - 1];

  if (
    previous &&
    previous.level === next.level &&
    previous.message === next.message &&
    previous.source === next.source
  ) {
    return [
      ...current.slice(0, -1),
      {
        ...previous,
        count: previous.count + 1,
        timestamp: next.timestamp,
      },
    ];
  }

  return [...current, next];
}

async function preparePreviewDocument(
  snippet: string,
  language: CodeLanguage | null,
  fileLabel: string,
  sessionKey: string,
): Promise<PreparedPreview> {
  if (!language) {
    return {
      sessionKey,
      srcDoc:
        "<!DOCTYPE html><html><body style=\"margin:0;display:grid;place-items:center;min-height:100%;background:#0f1115;color:#8b949e;font:14px system-ui,sans-serif;\">Select a runnable code file.</body></html>",
      diagnostics: [],
      runtimeLabel: `${fileLabel} / no runtime`,
      runnable: false,
    };
  }

  if (language === "typescript") {
    try {
      const ts = await import("typescript");
      const result = ts.transpileModule(snippet, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ES2020,
        },
        reportDiagnostics: true,
      });

      return {
        sessionKey,
        srcDoc: buildPreviewSrcDoc(
          result.outputText ?? "",
          "javascript",
          sessionKey,
        ),
        diagnostics: (result.diagnostics ?? []).map(formatTypeScriptDiagnostic),
        runtimeLabel: `${fileLabel} / ${getLanguageLabel(language)}`,
        runnable: true,
      };
    } catch {
      return {
        sessionKey,
        srcDoc: buildPreviewSrcDoc("", "javascript", sessionKey),
        diagnostics: [
          {
            id: "typescript-load-failed",
            kind: "compile",
            severity: "error",
            message: "TypeScript preview could not load the compiler for this run.",
            source: "TypeScript",
            guidance: "Reload the page once. If it still fails, use JavaScript for this round.",
          },
        ],
        runtimeLabel: `${fileLabel} / ${getLanguageLabel(language)}`,
        runnable: true,
      };
    }
  }

  return {
    sessionKey,
    srcDoc: buildPreviewSrcDoc(snippet, language, sessionKey),
    diagnostics: [],
    runtimeLabel: `${fileLabel} / ${getLanguageLabel(language)}`,
    runnable: true,
  };
}

function StatusBadge({
  status,
}: {
  status: RuntimeStatus;
}) {
  const classes =
    status === "success"
      ? "border-[rgba(46,160,67,0.45)] bg-[rgba(46,160,67,0.14)] text-[#7ee787]"
      : status === "running"
        ? "border-[rgba(24,144,241,0.45)] bg-[rgba(24,144,241,0.12)] text-[#78bfff]"
        : status === "compile_error"
          ? "border-[rgba(210,153,34,0.45)] bg-[rgba(210,153,34,0.14)] text-[#f4d27d]"
          : status === "runtime_error"
            ? "border-[rgba(248,81,73,0.45)] bg-[rgba(248,81,73,0.14)] text-[#ffb3ad]"
            : status === "no_runtime"
              ? "border-[#2d2d30] bg-[#111317] text-[#8b949e]"
              : "border-[#2d2d30] bg-[#181b20] text-[#c9d1d9]";

  const label =
    status === "compile_error"
      ? "compile error"
      : status === "runtime_error"
        ? "runtime error"
        : status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em]",
        classes,
      )}
    >
      {label}
    </span>
  );
}

function PreviewView({
  preparedPreview,
  executionResult,
  height,
  preparing,
}: {
  preparedPreview: PreparedPreview;
  executionResult: ExecutionResult;
  height: number;
  preparing: boolean;
}) {
  if (!preparedPreview.runnable) {
    return (
      <div
        className="grid place-items-center bg-[#0f1115] px-6 text-center"
        style={{ height }}
      >
        <div className="space-y-3">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[#8b949e]">
            No runtime
          </p>
          <p className="text-sm leading-7 text-[#9da7b3]">
            The active tab is not a runnable code file. Switch back to the main snippet or a same-language scratch file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      {preparing ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[rgba(15,17,21,0.82)]">
          <div className="flex items-center gap-3 rounded-[12px] border border-[#2d2d30] bg-[#111317] px-4 py-3 text-sm text-[#c9d1d9]">
            <LoaderCircle className="h-4 w-4 animate-spin text-[#78bfff]" />
            Preparing a fresh sandbox...
          </div>
        </div>
      ) : null}
      <iframe
        title="Snippet preview"
        srcDoc={preparedPreview.srcDoc}
        sandbox="allow-scripts"
        className="h-full w-full bg-white"
      />
      {executionResult.runtimeStatus === "runtime_error" ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 rounded-[12px] border border-[rgba(248,81,73,0.45)] bg-[rgba(39,14,16,0.92)] px-4 py-3 text-sm text-[#ffb3ad]">
          Preview crashed on the last run. Check the Problems tab for the exact error.
        </div>
      ) : null}
    </div>
  );
}

function ConsoleView({
  entries,
  height,
  runnable,
  status,
}: {
  entries: RuntimeConsoleEntry[];
  height: number;
  runnable: boolean;
  status: RuntimeStatus;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !stickToBottom) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [entries, stickToBottom]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto bg-[#0f1115] px-4 py-4 font-mono text-[12px] leading-6 text-[#c9d1d9]"
      style={{ height }}
      onScroll={(event) => {
        const node = event.currentTarget;
        const nearBottom =
          node.scrollHeight - node.scrollTop - node.clientHeight < 24;
        setStickToBottom(nearBottom);
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
        <span>{entries.length} entries</span>
        <span>{stickToBottom ? "following" : "paused"}</span>
      </div>
      {!runnable ? (
        <p className="text-[#7d8590]">
          Pick a runnable code file to watch its output here.
        </p>
      ) : entries.length === 0 ? (
        <p className="text-[#7d8590]">
          {status === "running"
            ? "Runtime is booting. Console output will land here as soon as the sandbox speaks."
            : "No console output yet. Run the snippet or interact with the preview."}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "rounded-[10px] border px-3 py-2",
                entry.level === "error"
                  ? "border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.08)]"
                  : entry.level === "warn"
                    ? "border-[rgba(210,153,34,0.35)] bg-[rgba(210,153,34,0.08)]"
                    : "border-[#2d2d30] bg-[#151a21]",
              )}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.64rem] uppercase tracking-[0.14em] text-[#8b949e]">
                <span>{formatRuntimeTime(entry.timestamp)}</span>
                <span>{entry.level}</span>
                {entry.source ? <span>{entry.source}</span> : null}
                {entry.count > 1 ? <span>x{entry.count}</span> : null}
              </div>
              <p className="whitespace-pre-wrap break-words">{entry.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProblemsView({
  diagnostics,
  runtimeErrors,
  height,
  runnable,
}: {
  diagnostics: RuntimeProblem[];
  runtimeErrors: RuntimeProblem[];
  height: number;
  runnable: boolean;
}) {
  return (
    <div
      className="overflow-auto bg-[#0f1115] px-4 py-4 font-mono text-[12px] leading-6 text-[#c9d1d9]"
      style={{ height }}
    >
      {!runnable ? (
        <p className="text-[#8b949e]">No runtime diagnostics for this file.</p>
      ) : diagnostics.length === 0 && runtimeErrors.length === 0 ? (
        <p className="text-[#8fbf8f]">No compile or runtime issues on the last run.</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              <span>Compile</span>
              <span>{diagnostics.length}</span>
            </div>
            {diagnostics.length === 0 ? (
              <div className="rounded-[10px] border border-[#2d2d30] bg-[#151a21] px-3 py-2 text-[#8b949e]">
                No compile diagnostics reported.
              </div>
            ) : (
              diagnostics.map((problem) => (
                <div
                  key={problem.id}
                  className={cn(
                    "rounded-[10px] border px-3 py-2",
                    problem.severity === "error"
                      ? "border-[rgba(210,153,34,0.35)] bg-[rgba(210,153,34,0.08)] text-[#f4d27d]"
                      : "border-[#2d2d30] bg-[#151a21]",
                  )}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.64rem] uppercase tracking-[0.14em] text-[#8b949e]">
                    <span>{problem.source ?? "compile"}</span>
                    {problem.line ? <span>{`line ${problem.line}`}</span> : null}
                    {problem.column ? <span>{`col ${problem.column}`}</span> : null}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{problem.message}</p>
                  {problem.guidance ? (
                    <p className="mt-2 text-[#c9d1d9]">{problem.guidance}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              <span>Runtime</span>
              <span>{runtimeErrors.length}</span>
            </div>
            {runtimeErrors.length === 0 ? (
              <div className="rounded-[10px] border border-[#2d2d30] bg-[#151a21] px-3 py-2 text-[#8b949e]">
                No runtime errors after the last run.
              </div>
            ) : (
              runtimeErrors.map((problem) => (
                <div
                  key={problem.id}
                  className="rounded-[10px] border border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.08)] px-3 py-2 text-[#ffb3ad]"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.64rem] uppercase tracking-[0.14em] text-[#ffd0cc]">
                    <span>{problem.source ?? "runtime"}</span>
                    {problem.line ? <span>{`line ${problem.line}`}</span> : null}
                    {problem.column ? <span>{`col ${problem.column}`}</span> : null}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{problem.message}</p>
                  {problem.stack ? (
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-[11px] text-[#ffc8c3]">
                      {problem.stack}
                    </pre>
                  ) : null}
                  {problem.guidance ? (
                    <p className="mt-2 text-[#ffd0cc]">{problem.guidance}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HtmlPreviewPanel({
  snippet,
  language = "html_css_js",
  fileLabel,
  className,
  height = 300,
  autoRun = true,
  embedded = false,
}: {
  snippet: string;
  language?: CodeLanguage | null;
  fileLabel?: string;
  className?: string;
  height?: number;
  autoRun?: boolean;
  embedded?: boolean;
}) {
  const [activeView, setActiveView] = useState<RuntimeView>("preview");
  const [manualRun, setManualRun] = useState(() => ({
    snippet,
    language,
    count: 1,
  }));
  const [autoRunTick, setAutoRunTick] = useState(1);
  const [resetCount, setResetCount] = useState(0);
  const targetFileLabel = fileLabel ?? "active file";
  const [preparing, setPreparing] = useState(false);
  const [preparedPreview, setPreparedPreview] = useState<PreparedPreview>(() => {
    const sessionKey = `relay-initial-${targetFileLabel}`;
    return {
      sessionKey,
      srcDoc: language
        ? buildPreviewSrcDoc(snippet, language, sessionKey)
        : buildPreviewSrcDoc("", "html_css_js", sessionKey),
      diagnostics: [],
      runtimeLabel: language
        ? `${targetFileLabel} / ${getLanguageLabel(language)}`
        : `${targetFileLabel} / no runtime`,
      runnable: Boolean(language),
    };
  });
  const [executionResult, setExecutionResult] = useState<ExecutionResult>(() =>
    createExecutionResult(
      targetFileLabel,
      language,
      preparedPreview.sessionKey,
      preparedPreview.runtimeLabel,
      language ? "idle" : "no_runtime",
      resetCount,
    ),
  );

  const effectiveSnippet = autoRun ? snippet : manualRun.snippet;
  const effectiveLanguage = autoRun ? language : manualRun.language;
  const effectiveRunCount = autoRun ? autoRunTick : manualRun.count;
  const hasPendingChanges =
    !autoRun &&
    (manualRun.snippet !== snippet || manualRun.language !== language);
  const compileProblemCount = executionResult.diagnostics.filter(
    (problem) => problem.severity === "error",
  ).length;
  const totalProblemCount =
    executionResult.diagnostics.length + executionResult.runtimeErrors.length;

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const sessionKey = `relay:${targetFileLabel}:${effectiveLanguage ?? "none"}:${effectiveRunCount}:${resetCount}:${startedAt}`;

    const prepare = async () => {
      if (cancelled) {
        return;
      }

      setPreparing(true);
      setExecutionResult(
        createExecutionResult(
          targetFileLabel,
          effectiveLanguage,
          sessionKey,
          effectiveLanguage
            ? `${targetFileLabel} / ${getLanguageLabel(effectiveLanguage)}`
            : `${targetFileLabel} / no runtime`,
          effectiveLanguage ? "running" : "no_runtime",
          resetCount,
        ),
      );

      const next = await preparePreviewDocument(
        effectiveSnippet,
        effectiveLanguage,
        targetFileLabel,
        sessionKey,
      );

      if (cancelled) {
        return;
      }

      const hasCompileErrors = next.diagnostics.some(
        (problem) => problem.severity === "error",
      );

      setPreparedPreview(next);
      setExecutionResult({
        runtimeStatus: !next.runnable
          ? "no_runtime"
          : hasCompileErrors
            ? "compile_error"
            : "running",
        targetFileLabel,
        targetLanguage: effectiveLanguage,
        startedAt,
        finishedAt: !next.runnable ? Date.now() : null,
        runTimestamp: startedAt,
        consoleEntries: [],
        diagnostics: next.diagnostics,
        runtimeErrors: [],
        previewMetadata: {
          sessionKey: next.sessionKey,
          targetFileLabel,
          targetLanguage: effectiveLanguage,
          runtimeLabel: next.runtimeLabel,
          previewKind: next.runnable ? "preview" : "no_runtime",
          resetCount,
        },
      });
      setPreparing(false);
    };

    const kickoff = window.setTimeout(() => {
      void prepare();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(kickoff);
    };
  }, [
    effectiveLanguage,
    effectiveRunCount,
    effectiveSnippet,
    resetCount,
    targetFileLabel,
  ]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<RuntimeMessagePayload>) => {
      const payload = event.data;

      if (
        !payload ||
        payload.source !== "relay-preview" ||
        payload.sessionKey !== executionResult.previewMetadata.sessionKey
      ) {
        return;
      }

      if (payload.type === "console") {
        const entry: RuntimeConsoleEntry = {
          id: `${payload.level ?? "log"}:${payload.timestamp ?? Date.now()}:${payload.message ?? ""}`,
          level: payload.level ?? "log",
          message: payload.message ?? "",
          timestamp: payload.timestamp ?? Date.now(),
          count: 1,
          source: payload.sourceLabel ?? null,
        };

        setExecutionResult((current) => ({
          ...current,
          consoleEntries: appendConsoleEntry(current.consoleEntries, entry),
        }));
        return;
      }

      if (payload.type === "error") {
        const fallbackLocation = extractStackLocation(payload.stack);
        const runtimeProblem: RuntimeProblem = {
          id: `runtime:${payload.timestamp ?? Date.now()}:${payload.message ?? "Runtime error"}`,
          kind: "runtime",
          severity: "error",
          message: payload.message ?? "Runtime error",
          line: payload.line ?? fallbackLocation.line,
          column: payload.column ?? fallbackLocation.column,
          source: payload.sourceLabel ?? "Runtime",
          stack: payload.stack ?? null,
          guidance: getProblemGuidance(
            payload.message ?? "Runtime error",
            executionResult.targetLanguage,
            "runtime",
          ),
        };

        setExecutionResult((current) => ({
          ...current,
          runtimeStatus: "runtime_error",
          runtimeErrors: [...current.runtimeErrors, runtimeProblem],
          finishedAt: payload.timestamp ?? Date.now(),
        }));
        setActiveView("problems");
        return;
      }

      if (payload.type === "ready") {
        setExecutionResult((current) => ({
          ...current,
          runtimeStatus:
            current.runtimeErrors.length > 0
              ? "runtime_error"
              : current.diagnostics.some((problem) => problem.severity === "error")
                ? "compile_error"
                : current.targetLanguage
                  ? "success"
                  : "no_runtime",
          finishedAt: payload.timestamp ?? Date.now(),
        }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [executionResult.previewMetadata.sessionKey, executionResult.targetLanguage]);

  const triggerRun = (resetPreview = false) => {
    if (resetPreview) {
      setResetCount((current) => current + 1);
      setActiveView("preview");
    }

    if (autoRun) {
      setAutoRunTick((current) => current + 1);
      return;
    }

    setManualRun((current) => ({
      snippet,
      language,
      count: current.count + 1,
    }));
  };

  return (
    <div
      className={cn(
        embedded
          ? "overflow-hidden bg-[#111317]"
          : "overflow-hidden rounded-[18px] border border-[#2d2d30] bg-[#111317] shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-[#2d2d30] px-4 py-2.5",
          embedded ? "bg-[#252526]" : "bg-[#161b22]",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#e6edf3]">
          <MonitorPlay className="h-4 w-4 text-[#1890f1]" />
          <span className="truncate">Run / Output</span>
          <StatusBadge status={executionResult.runtimeStatus} />
          {hasPendingChanges ? (
            <span className="rounded-full border border-[rgba(24,144,241,0.35)] bg-[rgba(24,144,241,0.12)] px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#78bfff]">
              pending
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["preview", "console", "problems"] as RuntimeView[]).map((view) => {
            const Icon =
              view === "preview"
                ? MonitorPlay
                : view === "console"
                  ? TerminalSquare
                  : Bug;
            const count =
              view === "console"
                ? executionResult.consoleEntries.length
                : view === "problems"
                  ? totalProblemCount
                  : null;

            return (
              <button
                key={view}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition",
                  embedded ? "rounded-[6px]" : "rounded-[9px]",
                  activeView === view
                    ? embedded
                      ? "border-[#2d2d30] bg-[#1e1e1e] text-[#e6edf3]"
                      : "border-[#264f78] bg-[#0b2538] text-[#e6edf3]"
                    : embedded
                      ? "border-[#2d2d30] bg-[#2d2d2d] text-[#9da7b3] hover:text-[#e6edf3]"
                      : "border-[#2d2d30] bg-[#111317] text-[#9da7b3] hover:text-[#e6edf3]",
                )}
                onClick={() => setActiveView(view)}
              >
                <Icon className="h-3.5 w-3.5" />
                {view}
                {typeof count === "number" ? (
                  <span className="text-[#8b949e]">{count}</span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 border border-[#2d2d30] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#e6edf3] transition hover:border-[#1890f1]",
              embedded ? "rounded-[6px] bg-[#1f2937]" : "rounded-[9px] bg-[#0f1720]",
            )}
            onClick={() => triggerRun(false)}
            disabled={executionResult.runtimeStatus === "no_runtime"}
          >
            <PlayCircle className="h-3.5 w-3.5 text-[#1890f1]" />
            {executionResult.runtimeStatus === "no_runtime"
              ? "No runtime"
              : hasPendingChanges
                ? "Run code"
                : "Run again"}
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 border border-[#2d2d30] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#9da7b3] transition hover:text-[#e6edf3]",
              embedded ? "rounded-[6px] bg-[#181b20]" : "rounded-[9px] bg-[#111317]",
            )}
            onClick={() => triggerRun(true)}
            disabled={executionResult.runtimeStatus === "no_runtime"}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset preview
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 border border-[#2d2d30] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#9da7b3] transition hover:text-[#e6edf3]",
              embedded ? "rounded-[6px] bg-[#181b20]" : "rounded-[9px] bg-[#111317]",
            )}
            onClick={() =>
              setExecutionResult((current) => ({
                ...current,
                consoleEntries: [],
              }))
            }
            disabled={executionResult.consoleEntries.length === 0}
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear console
          </button>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-[#2d2d30] px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]",
          embedded ? "bg-[#1e1e1e]" : "bg-[#111317]",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span>{preparedPreview.runtimeLabel}</span>
          <span>{executionResult.targetLanguage ? getLanguageLabel(executionResult.targetLanguage) : "No runtime"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span>{preparing ? "preparing" : `last run ${formatRuntimeTime(executionResult.runTimestamp)}`}</span>
          <span>{autoRun ? "live sync" : "manual run"}</span>
        </div>
      </div>

      {activeView === "preview" ? (
        <PreviewView
          preparedPreview={preparedPreview}
          executionResult={executionResult}
          height={height}
          preparing={preparing}
        />
      ) : activeView === "console" ? (
        <ConsoleView
          entries={executionResult.consoleEntries}
          height={height}
          runnable={preparedPreview.runnable}
          status={executionResult.runtimeStatus}
        />
      ) : (
        <ProblemsView
          diagnostics={executionResult.diagnostics}
          runtimeErrors={executionResult.runtimeErrors}
          height={height}
          runnable={preparedPreview.runnable}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2d2d30] bg-[#0f1115] px-4 py-2 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-[#8b949e]">
        <div className="flex flex-wrap items-center gap-3">
          <span>{executionResult.targetFileLabel}</span>
          <span>{executionResult.consoleEntries.length} logs</span>
          <span>{compileProblemCount} compile errors</span>
          <span>{executionResult.runtimeErrors.length} runtime errors</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span>Run: {autoRun ? "live sync" : "manual snapshot"}</span>
          <span>Reset count: {executionResult.previewMetadata.resetCount}</span>
        </div>
      </div>
    </div>
  );
}
