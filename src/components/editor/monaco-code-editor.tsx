"use client";

import type { ReactNode } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import type { CodeLanguage } from "@/features/game/types";
import { getLanguageLabel } from "@/features/game/logic";
import { EditorShell } from "@/components/editor/editor-shell";
import {
  getEditorFilename,
  getEditorTreeItems,
  getMonacoEditorOptions,
  getMonacoLanguage,
  getEditorWorkspacePath,
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
  notesLines,
  settingsLines,
  toolsLines,
}: {
  value: string;
  language: CodeLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: number;
  className?: string;
  title?: string;
  footer?: ReactNode;
  notesLines?: string[];
  settingsLines?: string[];
  toolsLines?: string[];
}) {
  const fileName = title ?? getEditorFilename(language);
  const workspacePath = getEditorWorkspacePath(language);

  return (
    <EditorShell
      className={className}
      title={`relay/${workspacePath}`}
      tabLabel={fileName}
      treeItems={getEditorTreeItems(language)}
      footer={footer}
      notesLines={notesLines}
      settingsLines={settingsLines}
      toolsLines={toolsLines}
      statusLeft={
        <>
          <span>{readOnly ? "VIEW" : "EDIT"}</span>
          <span>{getLanguageLabel(language)}</span>
          <span>UTF-8</span>
        </>
      }
      statusRight={
        <>
          <span>{readOnly ? "read-only" : "spaces: 2"}</span>
          <span>relay room</span>
        </>
      }
    >
      <div className={cn("min-w-0 bg-[#1e1e1e]")}>
        <Editor
          beforeMount={beforeMount}
          height={height}
          language={getMonacoLanguage(language)}
          value={value}
          theme="relay-night"
          onChange={(nextValue) => onChange?.(nextValue ?? "")}
          options={getMonacoEditorOptions(readOnly)}
          loading={
            <div className="flex h-full min-h-[260px] items-center justify-center bg-[#1e1e1e] text-sm text-[#8b949e]">
              Loading editor...
            </div>
          }
        />
      </div>
    </EditorShell>
  );
}
