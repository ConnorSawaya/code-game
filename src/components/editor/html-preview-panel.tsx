"use client";

import { useEffect, useMemo, useState } from "react";
import { Bug, MonitorPlay, PlayCircle, TerminalSquare } from "lucide-react";
import type { CodeLanguage } from "@/features/game/types";
import { buildPreviewSrcDoc } from "@/features/game/editor";
import { cn } from "@/lib/utils";

function RuntimeSession({
  activeView,
  srcDoc,
  height,
}: {
  activeView: "preview" | "console" | "problems";
  srcDoc: string;
  height: number;
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
          title="HTML/CSS/JS preview"
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
            <p className="text-[#7d8590]">No console output yet. Run the snippet or interact with the preview.</p>
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
          {runtimeErrors.length === 0 ? (
            <p className="text-[#8fbf8f]">No runtime errors reported yet.</p>
          ) : (
            <div className="space-y-2">
              {runtimeErrors.map((error, index) => (
                <div
                  key={`${error}-${index}`}
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
}: {
  snippet: string;
  language?: CodeLanguage;
  className?: string;
  height?: number;
}) {
  const [activeView, setActiveView] = useState<"preview" | "console" | "problems">("preview");
  const [runVersion, setRunVersion] = useState(0);
  const srcDoc = useMemo(() => buildPreviewSrcDoc(snippet, language), [language, snippet]);
  const sessionKey = `${language}:${runVersion}:${snippet}`;

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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-[9px] border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition",
              activeView === "preview"
                ? "border-[#264f78] bg-[#0b2538] text-[#e6edf3]"
                : "border-[#2d2d30] bg-[#111317] text-[#9da7b3] hover:text-[#e6edf3]",
            )}
            onClick={() => setActiveView("preview")}
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-[9px] border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition",
              activeView === "console"
                ? "border-[#264f78] bg-[#0b2538] text-[#e6edf3]"
                : "border-[#2d2d30] bg-[#111317] text-[#9da7b3] hover:text-[#e6edf3]",
            )}
            onClick={() => setActiveView("console")}
          >
            <TerminalSquare className="h-3.5 w-3.5" />
            Console
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-[9px] border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition",
              activeView === "problems"
                ? "border-[#264f78] bg-[#0b2538] text-[#e6edf3]"
                : "border-[#2d2d30] bg-[#111317] text-[#9da7b3] hover:text-[#e6edf3]",
            )}
            onClick={() => setActiveView("problems")}
          >
            <Bug className="h-3.5 w-3.5" />
            Problems
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[9px] border border-[#2d2d30] bg-[#0f1720] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#e6edf3] transition hover:border-[#1890f1]"
            onClick={() => setRunVersion((current) => current + 1)}
          >
            <PlayCircle className="h-3.5 w-3.5 text-[#1890f1]" />
            Run
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#111317] px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
        <span>{language === "javascript" ? "JavaScript sandbox" : "HTML / CSS / JS sandbox"}</span>
        <span>{runVersion > 0 ? `run ${runVersion + 1}` : "run 1"}</span>
      </div>
      <RuntimeSession key={sessionKey} activeView={activeView} srcDoc={srcDoc} height={height} />
    </div>
  );
}
