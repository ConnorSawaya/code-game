"use client";

import type { ReactNode } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import type { CodeLanguage } from "@/features/game/types";
import { getLanguageLabel } from "@/features/game/logic";
import {
  getEditorFilename,
  getMonacoEditorOptions,
  getMonacoLanguage,
  registerRelayMonacoTheme,
} from "@/features/game/editor";
import { cn } from "@/lib/utils";

const beforeMount: BeforeMount = (monaco: typeof Monaco) => {
  registerRelayMonacoTheme(monaco);
};

export function MonacoCodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = 340,
  className,
  title,
  footer,
}: {
  value: string;
  language: CodeLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: number;
  className?: string;
  title?: string;
  footer?: ReactNode;
}) {
  return (
    <div className={cn("panel-ink overflow-hidden rounded-[26px]", className)}>
      <div className="flex items-center justify-between border-b border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#b8c5de]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff7d5c]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f5be4f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#56c271]" />
          </div>
          <span className="font-medium text-[#dce5f7]">
            {title ?? getEditorFilename(language)}
          </span>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8ea4d2]">
          {getLanguageLabel(language)}
        </div>
      </div>
      <Editor
        beforeMount={beforeMount}
        height={height}
        language={getMonacoLanguage(language)}
        value={value}
        theme="relay-night"
        onChange={(nextValue) => onChange?.(nextValue ?? "")}
        options={getMonacoEditorOptions(readOnly)}
        loading={
          <div className="flex h-full min-h-[260px] items-center justify-center bg-[#111723] text-sm text-[#8ea4d2]">
            Loading editor…
          </div>
        }
      />
      {footer ? (
        <div className="border-t border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#9eabc7]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
