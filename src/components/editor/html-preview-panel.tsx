"use client";

import { useEffect, useMemo, useState } from "react";
import { Bug, MonitorPlay, PlayCircle, TerminalSquare } from "lucide-react";
import type { CodeLanguage } from "@/features/game/types";
import { buildPreviewSrcDoc } from "@/features/game/editor";
import { cn } from "@/lib/utils";

type RuntimeView = "preview" | "console" | "problems";

type PreparedPreview = {
  srcDoc: string;
  problems: string[];
  runtimeLabel: string;
};

function formatTypeScriptDiagnostic(
  diagnostic: import("typescript").Diagnostic,
) {
  const messageText =
    typeof diagnostic.messageText === "string"
      ? diagnostic.messageText
      : diagnostic.messageText.messageText;

  if (
    diagnostic.file &&
    typeof diagnostic.start === "number"
  ) {
    const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return `Line ${position.line + 1}, column ${position.character + 1}: ${messageText}`;
  }

  return messageText;
}

async function preparePreviewDocument(
  snippet: string,
  language: CodeLanguage,
): Promise<PreparedPreview> {
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
        srcDoc: buildPreviewSrcDoc(result.outputText ?? "", "javascript"),
        problems: (result.diagnostics ?? []).map(formatTypeScriptDiagnostic),
        runtimeLabel: "TypeScript sandbox",
      };
    } catch {
      return {
        srcDoc: buildPreviewSrcDoc("", "javascript"),
        problems: ["TypeScript preview could not load the compiler for this run."],
        runtimeLabel: "TypeScript sandbox",
      };
    }
  }

  return {
    srcDoc: buildPreviewSrcDoc(snippet, language),
    problems: [],
    runtimeLabel:
      language === "javascript" ? "JavaScript sandbox" : "HTML / CSS / JS sandbox",
  };
}

function RuntimeSession({
  activeView,
  srcDoc,
  height,
  staticProblems,
}: {
  activeView: RuntimeView;
  srcDoc: string;
  height: number;
  staticProblems: string[];
}) {
  const [consoleEntries, setConsoleEntries] = useState<
    Array<{ level: string; message: string }>
  >([]);
  const [runtimeErrors, setRuntimeErrors] = useState<string[]>([]);
  const [runtimeReady, setRuntimeReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data;

      if (!payload || payload.source !== "relay-preview") {
        return;
      }

      if (payload.type === "console") {
        setConsoleEntries((current) => [
          ...current,
          {
            level: payload.level ?? "log",
            message: payload.message ?? "",
          },
        ]);
      }

      if (payload.type === "error") {
        setRuntimeErrors((current) => [...current, payload.message ?? "Runtime error"]);
      }

      if (payload.type === "ready") {
        setRuntimeReady(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#111317] px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
        <span>Browser sandbox</span>
        <span>{runtimeReady ? "runtime ready" : "booting sandbox"}</span>
      </div>
      {activeView === "preview" ? (
        <iframe
          title="Snippet preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          className="w-full bg-white"
          style={{ height }}
        />
      ) : activeView === "console" ? (
        <div
          className="overflow-auto bg-[#0f1115] px-4 py-4 font-mono text-[12px] leading-6 text-[#c9d1d9]"
          style={{ height }}
        >
          {consoleEntries.length === 0 ? (
            <p className="text-[#7d8590]">
              No console output yet. Run the snippet or interact with the preview.
            </p>
          ) : (
            <div className="space-y-2">
              {consoleEntries.map((entry, index) => (
                <div
                  key={`${entry.level}-${index}`}
                  className="rounded-[10px] border border-[#2d2d30] bg-[#151a21] px-3 py-2"
                >
                  <span className="mr-2 text-[#8b949e]">{entry.level}</span>
                  <span>{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className="overflow-auto bg-[#0f1115] px-4 py-4 font-mono text-[12px] leading-6 text-[#c9d1d9]"
          style={{ height }}
        >
          {staticProblems.length === 0 && runtimeErrors.length === 0 ? (
            <p className="text-[#8fbf8f]">No issues reported after the last run.</p>
          ) : (
            <div className="space-y-2">
              {staticProblems.map((problem, index) => (
                <div
                  key={`static-${problem}-${index}`}
                  className="rounded-[10px] border border-[rgba(210,153,34,0.35)] bg-[rgba(210,153,34,0.08)] px-3 py-2 text-[#f4d27d]"
                >
                  {problem}
                </div>
              ))}
              {runtimeErrors.map((error, index) => (
                <div
                  key={`runtime-${error}-${index}`}
                  className="rounded-[10px] border border-[rgba(248,81,73,0.35)] bg-[rgba(248,81,73,0.08)] px-3 py-2 text-[#ffb3ad]"
                >
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function HtmlPreviewPanel({
  snippet,
  language = "html_css_js",
  className,
  height = 300,
  autoRun = true,
}: {
  snippet: string;
  language?: CodeLanguage;
  className?: string;
  height?: number;
  autoRun?: boolean;
}) {
  const [activeView, setActiveView] = useState<RuntimeView>("preview");
  const [manualRun, setManualRun] = useState(() => ({
    snippet,
    language,
    count: 1,
  }));
  const [preparing, setPreparing] = useState(false);
  const [preparedPreview, setPreparedPreview] = useState<PreparedPreview>(() => ({
    srcDoc: buildPreviewSrcDoc(snippet, language),
    problems: [],
    runtimeLabel:
      language === "javascript"
        ? "JavaScript sandbox"
        : language === "typescript"
          ? "TypeScript sandbox"
          : "HTML / CSS / JS sandbox",
  }));
  const effectiveSnippet = autoRun ? snippet : manualRun.snippet;
  const effectiveLanguage = autoRun ? language : manualRun.language;
  const effectiveRunCount = autoRun ? 1 : manualRun.count;

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      setPreparing(true);
      const next = await preparePreviewDocument(effectiveSnippet, effectiveLanguage);

      if (!cancelled) {
        setPreparedPreview(next);
        setPreparing(false);
      }
    };

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [effectiveLanguage, effectiveRunCount, effectiveSnippet]);

  const sessionKey = useMemo(
    () => (autoRun ? `${language}:${snippet}` : `${manualRun.language}:${manualRun.count}`),
    [autoRun, language, manualRun.count, manualRun.language, snippet],
  );
  const hasPendingChanges =
    !autoRun && (manualRun.snippet !== snippet || manualRun.language !== language);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border border-[#2d2d30] bg-[#111317] shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d2d30] bg-[#161b22] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#e6edf3]">
          <MonitorPlay className="h-4 w-4 text-[#1890f1]" />
          Runtime panel
          {hasPendingChanges ? (
            <span className="rounded-full border border-[rgba(24,144,241,0.35)] bg-[rgba(24,144,241,0.12)] px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#78bfff]">
              changes pending
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

            return (
              <button
                key={view}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-[9px] border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition",
                  activeView === view
                    ? "border-[#264f78] bg-[#0b2538] text-[#e6edf3]"
                    : "border-[#2d2d30] bg-[#111317] text-[#9da7b3] hover:text-[#e6edf3]",
                )}
                onClick={() => setActiveView(view)}
              >
                <Icon className="h-3.5 w-3.5" />
                {view}
              </button>
            );
          })}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[9px] border border-[#2d2d30] bg-[#0f1720] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#e6edf3] transition hover:border-[#1890f1]"
            onClick={() => {
              setManualRun((current) => ({
                snippet,
                language,
                count: current.count + 1,
              }));
            }}
          >
            <PlayCircle className="h-3.5 w-3.5 text-[#1890f1]" />
            {hasPendingChanges ? "Run changes" : "Re-run"}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#111317] px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
        <span>{preparedPreview.runtimeLabel}</span>
        <span>{preparing ? "preparing run" : autoRun ? "live preview" : `run ${manualRun.count}`}</span>
      </div>
      <RuntimeSession
        key={sessionKey}
        activeView={activeView}
        srcDoc={preparedPreview.srcDoc}
        height={height}
        staticProblems={preparedPreview.problems}
      />
    </div>
  );
}
