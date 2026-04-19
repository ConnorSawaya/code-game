"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { FilePlus2, Settings2, WrapText } from "lucide-react";
import type { CodeLanguage } from "@/features/game/types";
import { Button } from "@/components/ui/button";
import {
  EditorShell,
  type EditorSidebarEntry,
  type EditorTabItem,
  type EditorTreeItem,
} from "@/components/editor/editor-shell";
import { Input } from "@/components/ui/input";
import { SelectableChip } from "@/components/ui/chip";
import {
  DEFAULT_RELAY_EDITOR_PREFERENCES,
  getDocumentLanguageLabel,
  getEditorFilename,
  getEditorSourceFolder,
  getMonacoEditorOptions,
  getMonacoLanguage,
  normalizeCodeFilename,
  registerRelayMonacoTheme,
  type RelayDocumentLanguage,
  type RelayEditorPreferences,
} from "@/features/game/editor";
import { cn } from "@/lib/utils";

const beforeMount: BeforeMount = (monaco: typeof Monaco) => {
  registerRelayMonacoTheme(monaco);
};

type WorkspaceFileKind = "code" | "notes" | "settings";

interface WorkspaceFile {
  id: string;
  label: string;
  path: string;
  kind: WorkspaceFileKind;
  language: RelayDocumentLanguage;
  content: string;
  editable: boolean;
  isPrimary?: boolean;
}

export interface MonacoEditorContext {
  activeFile: WorkspaceFile;
  preferences: RelayEditorPreferences;
  canRun: boolean;
}

function getFileKindLabel(kind: WorkspaceFileKind) {
  if (kind === "notes") {
    return "NOTES";
  }

  if (kind === "settings") {
    return "SETTINGS";
  }

  return "EDIT";
}

function buildReadonlyLines(title: string, lines?: string[]) {
  if (lines?.length) {
    return lines.join("\n");
  }

  return [`# ${title}`, "", "Use the explorer to move through the workspace."].join(
    "\n",
  );
}

function buildWorkspaceTreeItems(
  workspaceRoot: string,
  sourceFolder: string,
  files: WorkspaceFile[],
): EditorTreeItem[] {
  const codeFiles = files.filter((file) => file.kind === "code");
  const docFiles = files.filter((file) => file.kind !== "code");

  return [
    { id: "workspace-root", label: workspaceRoot, depth: 0, kind: "folder" },
    { id: "workspace-source", label: sourceFolder, depth: 1, kind: "folder" },
    ...codeFiles.map((file) => ({
      id: file.id,
      label: file.label,
      depth: 2,
      kind: "file" as const,
      fileKind: "code" as const,
    })),
    ...docFiles.map((file) => ({
      id: file.id,
      label: file.label,
      depth: 1,
      kind: "file" as const,
      fileKind: file.kind === "notes" ? ("markdown" as const) : ("json" as const),
    })),
  ];
}

function buildWorkspaceTabs(files: WorkspaceFile[]): EditorTabItem[] {
  return files.map((file) => ({
    id: file.id,
    label: file.label,
    fileKind:
      file.kind === "notes"
        ? "markdown"
        : file.kind === "settings"
          ? "json"
          : "code",
  }));
}

function SettingsPanel({
  preferences,
  setPreferences,
  roomSettingsLines,
}: {
  preferences: RelayEditorPreferences;
  setPreferences: Dispatch<SetStateAction<RelayEditorPreferences>>;
  roomSettingsLines: string[];
}) {
  return (
    <div className="grid gap-5 bg-[#1e1e1e] px-5 py-5 font-mono text-[13px] text-[#c9d1d9]">
      <div className="flex items-center gap-2 text-[#4ec9b0]">
        <Settings2 className="h-4 w-4" />
        <span>{`// room.settings.json`}</span>
      </div>
      <div className="grid gap-4 rounded-[12px] border border-[#2d2d30] bg-[#181a1f] p-4">
        <div className="space-y-2">
          <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[#8b949e]">
            Word wrap
          </p>
          <div className="flex flex-wrap gap-2">
            {(["off", "on"] as const).map((option) => (
              <SelectableChip
                key={option}
                selected={preferences.wordWrap === option}
                label={option === "off" ? "Wrap off" : "Wrap on"}
                onClick={() =>
                  setPreferences((current) => ({ ...current, wordWrap: option }))
                }
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[#8b949e]">
            Tab size
          </p>
          <div className="flex flex-wrap gap-2">
            {[2, 4].map((size) => (
              <SelectableChip
                key={size}
                selected={preferences.tabSize === size}
                label={`${size} spaces`}
                onClick={() =>
                  setPreferences((current) => ({
                    ...current,
                    tabSize: size as 2 | 4,
                  }))
                }
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[#8b949e]">
            Minimap
          </p>
          <button
            type="button"
            onClick={() =>
              setPreferences((current) => ({
                ...current,
                minimap: !current.minimap,
              }))
            }
            className={cn(
              "inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-sm transition",
              preferences.minimap
                ? "border-[rgba(0,122,204,0.65)] bg-[rgba(0,122,204,0.16)] text-[#e6edf3]"
                : "border-[#2d2d30] bg-[#111317] text-[#9da7b3]",
            )}
          >
            <WrapText className="h-4 w-4" />
            {preferences.minimap ? "Minimap on" : "Minimap off"}
          </button>
        </div>
      </div>
      <div className="grid gap-1 rounded-[12px] border border-[#2d2d30] bg-[#181a1f] px-4 py-4 text-[12px] leading-6 text-[#9da7b3]">
        {roomSettingsLines.map((line, index) => (
          <p key={`${line}-${index}`} className="whitespace-pre-wrap break-words">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export function MonacoCodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = 340,
  panelHeight = 0,
  className,
  title,
  workspaceLabel = "relay-room",
  footer,
  notesLines,
  settingsLines,
  toolsLines,
  panel,
  panelPosition = "bottom",
  panelClassName,
}: {
  value: string;
  language: CodeLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: number;
  panelHeight?: number;
  className?: string;
  title?: string;
  workspaceLabel?: string;
  footer?: ReactNode | ((context: MonacoEditorContext) => ReactNode);
  notesLines?: string[];
  settingsLines?: string[];
  toolsLines?: string[];
  panel?: ReactNode | ((context: MonacoEditorContext) => ReactNode);
  panelPosition?: "right" | "bottom";
  panelClassName?: string;
}) {
  const primaryFilename = title ?? getEditorFilename(language);
  const sourceFolder = getEditorSourceFolder(language);
  const [preferences, setPreferences] = useState(DEFAULT_RELAY_EDITOR_PREFERENCES);
  const [primaryContent, setPrimaryContent] = useState(value);
  const [activeTabId, setActiveTabId] = useState("primary");
  const [scratchFiles, setScratchFiles] = useState<WorkspaceFile[]>([]);
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const activeFileIdRef = useRef("primary");

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setScratchFiles([]);
      setPrimaryContent(value);
      setActiveTabId("primary");
      activeFileIdRef.current = "primary";
      setPreferences(DEFAULT_RELAY_EDITOR_PREFERENCES);
      setCreatingFile(false);
      setNewFileName("");
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [language, value]);

  useEffect(() => {
    const activeId = activeFileIdRef.current;
    const syncTimer = window.setTimeout(() => {
      if (activeId === "primary") {
        setPrimaryContent((current) => (current === value ? current : value));
        return;
      }

      setScratchFiles((current) =>
        current.map((file) =>
          file.id === activeId && file.content !== value
            ? { ...file, content: value }
            : file,
        ),
      );
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, [value]);

  const files = useMemo<WorkspaceFile[]>(() => {
    const primaryFile: WorkspaceFile = {
      id: "primary",
      label: primaryFilename,
      path: `${sourceFolder}/${primaryFilename}`,
      kind: "code",
      language,
      content: primaryContent,
      editable: !readOnly,
      isPrimary: true,
    };

    return [
      primaryFile,
      ...scratchFiles,
      {
        id: "notes",
        label: "README.md",
        path: "README.md",
        kind: "notes",
        language: "markdown",
        content: buildReadonlyLines("README.md", notesLines),
        editable: false,
      },
      {
        id: "settings",
        label: "room.settings.json",
        path: "room.settings.json",
        kind: "settings",
        language: "json",
        content: buildReadonlyLines("room.settings.json", settingsLines),
        editable: false,
      },
    ];
  }, [
    language,
    notesLines,
    primaryContent,
    primaryFilename,
    readOnly,
    scratchFiles,
    settingsLines,
    sourceFolder,
  ]);

  useEffect(() => {
    if (!files.some((file) => file.id === activeTabId)) {
      const tabTimer = window.setTimeout(() => {
        setActiveTabId("primary");
        activeFileIdRef.current = "primary";
      }, 0);

      return () => window.clearTimeout(tabTimer);
    }

    return undefined;
  }, [activeTabId, files]);

  const activeFile =
    files.find((file) => file.id === activeTabId) ??
    files.find((file) => file.id === "primary")!;

  const activeContext = useMemo<MonacoEditorContext>(
    () => ({
      activeFile,
      preferences,
      canRun: activeFile.kind === "code",
    }),
    [activeFile, preferences],
  );

  const contentMinHeight =
    height + (panel ? panelHeight + (panelPosition === "bottom" ? 92 : 0) : 0);

  const statusLeft = (
    <>
      <span>{readOnly ? "VIEW" : getFileKindLabel(activeFile.kind)}</span>
      <span>{getDocumentLanguageLabel(activeFile.language)}</span>
      <span>UTF-8</span>
    </>
  );

  const statusRight = (
    <>
      <span>{activeFile.editable ? `spaces: ${preferences.tabSize}` : "read-only"}</span>
      <span>{`wrap: ${preferences.wordWrap}`}</span>
      <span className="max-w-[20rem] truncate">{activeFile.path}</span>
    </>
  );

  const handleTabChange = (nextId: string) => {
    setActiveTabId(nextId);
    activeFileIdRef.current = nextId;

    const nextFile = files.find((file) => file.id === nextId);
    if (nextFile?.kind === "code") {
      onChange?.(nextFile.content);
    }
  };

  const handleCodeChange = (nextValue: string) => {
    if (activeFile.kind !== "code") {
      return;
    }

    if (activeFile.isPrimary) {
      setPrimaryContent(nextValue);
      onChange?.(nextValue);
      return;
    }

    setScratchFiles((current) =>
      current.map((file) =>
        file.id === activeFile.id ? { ...file, content: nextValue } : file,
      ),
    );
    onChange?.(nextValue);
  };

  const handleCreateFile = () => {
    const normalizedName = normalizeCodeFilename(newFileName, language);
    const existingNames = files
      .filter((file) => file.kind === "code")
      .map((file) => file.label.toLowerCase());

    if (existingNames.includes(normalizedName.toLowerCase())) {
      return;
    }

    const nextFile: WorkspaceFile = {
      id: `scratch-${Date.now()}`,
      label: normalizedName,
      path: `${sourceFolder}/${normalizedName}`,
      kind: "code",
      language,
      content: "",
      editable: !readOnly,
    };

    setScratchFiles((current) => [...current, nextFile]);
    setCreatingFile(false);
    setNewFileName("");
    setActiveTabId(nextFile.id);
    activeFileIdRef.current = nextFile.id;
    onChange?.("");
  };

  const explorerAction = readOnly ? null : creatingFile ? (
    <div className="flex w-full items-center gap-2 xl:w-auto">
      <Input
        value={newFileName}
        onChange={(event) => setNewFileName(event.target.value)}
        className="h-8 min-w-[150px] rounded-[8px] border-[#2d2d30] bg-[#111317] px-2.5 text-[0.78rem] xl:w-[150px]"
        placeholder={primaryFilename.replace(/^main/, "scratch")}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleCreateFile();
          }
          if (event.key === "Escape") {
            setCreatingFile(false);
            setNewFileName("");
          }
        }}
      />
      <Button
        size="sm"
        className="h-8 rounded-[8px] px-2.5"
        onClick={handleCreateFile}
        disabled={newFileName.trim().length === 0}
      >
        Add
      </Button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setCreatingFile(true)}
      className="inline-flex items-center gap-1 rounded-[8px] border border-[#2d2d30] bg-[#111317] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#9da7b3] transition hover:text-[#e6edf3]"
    >
      <FilePlus2 className="h-3.5 w-3.5" />
      New file
    </button>
  );

  const treeItems = buildWorkspaceTreeItems(workspaceLabel, sourceFolder, files);
  const tabs = buildWorkspaceTabs(files);
  const searchItems: EditorSidebarEntry[] = files.map((file) => ({
    id: `search-${file.id}`,
    label: `file:${file.label}`,
    targetId: file.id,
  }));
  const outlineItems: EditorSidebarEntry[] = [
    { id: "outline-active", label: activeFile.label, targetId: activeFile.id },
    { id: "outline-constraints", label: "round constraints", targetId: "settings" },
    { id: "outline-notes", label: "relay notes", targetId: "notes" },
  ];

  const shellFooter =
    typeof footer === "function" ? footer(activeContext) : footer;
  const shellPanel =
    typeof panel === "function" ? panel(activeContext) : panel;

  return (
    <EditorShell
      className={className}
      title={`${workspaceLabel}/${activeFile.path}`}
      workspaceLabel={workspaceLabel}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      tabs={tabs}
      treeItems={treeItems}
      searchItems={searchItems}
      outlineItems={outlineItems}
      toolsLines={
        toolsLines ?? [
          "The active file is the snippet you are editing.",
          "Open room settings to tune wrap, tabs, and minimap.",
          "Scratch files stay local to this browser session.",
        ]
      }
      railSettingsPanel={
        <div className="grid gap-2">
          <div className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-[0.8rem] text-[#c9d1d9]">
            Wrap: <span className="text-[#e6edf3]">{preferences.wordWrap}</span>
          </div>
          <div className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-[0.8rem] text-[#c9d1d9]">
            Tabs: <span className="text-[#e6edf3]">{preferences.tabSize} spaces</span>
          </div>
          <div className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-[0.8rem] text-[#c9d1d9]">
            Minimap: <span className="text-[#e6edf3]">{preferences.minimap ? "on" : "off"}</span>
          </div>
        </div>
      }
      explorerAction={explorerAction}
      contentMinHeight={contentMinHeight}
      footer={shellFooter}
      statusLeft={statusLeft}
      statusRight={statusRight}
      panel={shellPanel}
      panelPosition={panelPosition}
      panelClassName={panelClassName}
      content={
        activeFile.kind === "code" ? (
          <div className="min-w-0 bg-[#1e1e1e]">
            <Editor
              beforeMount={beforeMount}
              height={height}
              path={activeFile.path}
              language={getMonacoLanguage(activeFile.language)}
              value={activeFile.content}
              theme="relay-night"
              onChange={(nextValue) => handleCodeChange(nextValue ?? "")}
              options={getMonacoEditorOptions(
                readOnly || !activeFile.editable,
                preferences,
              )}
              loading={
                <div className="flex h-full min-h-[260px] items-center justify-center bg-[#1e1e1e] text-sm text-[#8b949e]">
                  Loading editor...
                </div>
              }
            />
          </div>
        ) : activeFile.kind === "settings" ? (
          <SettingsPanel
            preferences={preferences}
            setPreferences={setPreferences}
            roomSettingsLines={buildReadonlyLines("room.settings.json", settingsLines).split(
              "\n",
            )}
          />
        ) : (
          <div
            className="grid gap-4 bg-[#1e1e1e] px-5 py-4 font-mono text-[13px] leading-7 text-[#c9d1d9]"
            style={{ minHeight: height }}
          >
            <p className="text-[#4ec9b0]">{`# ${activeFile.label}`}</p>
            {activeFile.content.split("\n").map((line, index) => (
              <p key={`${line}-${index}`} className="whitespace-pre-wrap break-words">
                {line}
              </p>
            ))}
          </div>
        )
      }
    />
  );
}
