"use client";

import { useMemo } from "react";
import { MonitorPlay } from "lucide-react";
import { buildPreviewSrcDoc } from "@/features/game/editor";
import { cn } from "@/lib/utils";

export function HtmlPreviewPanel({
  snippet,
  className,
  height = 300,
}: {
  snippet: string;
  className?: string;
  height?: number;
}) {
  const srcDoc = useMemo(() => buildPreviewSrcDoc(snippet), [snippet]);

  return (
    <div className={cn("overflow-hidden rounded-[24px] border border-[color:var(--color-border)] bg-[rgba(255,255,255,0.9)] shadow-[var(--shadow-panel)]", className)}>
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,238,225,0.94))] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
          <MonitorPlay className="h-4 w-4 text-[color:var(--color-cobalt)]" />
          Safe Preview
        </div>
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          HTML/CSS/JS sandbox
        </p>
      </div>
      <iframe
        title="HTML/CSS/JS preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="w-full bg-white"
        style={{ height }}
      />
    </div>
  );
}
