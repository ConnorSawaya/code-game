"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Blocks,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson2,
  FileText,
  Files,
  Folder,
  FolderOpen,
  Search,
  Settings2,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditorTreeItem {
  label: string;
  active?: boolean;
  depth?: number;
  kind?: "file" | "folder";
  documentId?: "editor" | "notes" | "settings";
}

type RailPaneId = "explorer" | "search" | "outline" | "tools" | "settings";
type EditorDocumentId = "editor" | "notes" | "settings";

const railItems: Array<{
  id: RailPaneId;
  label: string;
  icon: typeof Files;
}> = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "outline", label: "Outline", icon: Blocks },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings2 },
];

function getDocumentForTreeItem(
  item: EditorTreeItem,
  tabLabel: string,
): EditorDocumentId | null {
  if (item.documentId) {
    return item.documentId;
  }

  if (item.label === tabLabel) {
    return "editor";
  }

  if (item.label.toLowerCase().includes("readme")) {
    return "notes";
  }

  if (item.label.toLowerCase().includes("settings")) {
    return "settings";
  }

  return null;
}

function isTreeItemVisible(treeItems: EditorTreeItem[], index: number, openFolders: Set<string>) {
  let currentDepth = treeItems[index]?.depth ?? 0;

  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const candidate = treeItems[cursor];
    const candidateDepth = candidate.depth ?? 0;

    if (candidateDepth < currentDepth && candidate.kind === "folder") {
      if (!openFolders.has(candidate.label)) {
        return false;
      }

      currentDepth = candidateDepth;
    }
  }

  return true;
}

export function EditorShell({
  title,
  tabLabel,
  statusLeft,
  statusRight,
  treeLabel = "Explorer",
  treeItems,
  children,
  footer,
  notesTitle = "README.md",
  notesLines,
  settingsTitle = "room.settings.json",
  settingsLines,
  toolsLines,
  searchItems,
  className,
}: {
  title: string;
  tabLabel: string;
  statusLeft: ReactNode;
  statusRight?: ReactNode;
  treeLabel?: string;
  treeItems: EditorTreeItem[];
  children: ReactNode;
  footer?: ReactNode;
  notesTitle?: string;
  notesLines?: string[];
  settingsTitle?: string;
  settingsLines?: string[];
  toolsLines?: string[];
  searchItems?: string[];
  className?: string;
}) {
  const [activePane, setActivePane] = useState<RailPaneId>("explorer");
  const [activeDocument, setActiveDocument] = useState<EditorDocumentId>("editor");
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    () =>
      new Set(
        treeItems
          .filter((item) => item.kind === "folder")
          .map((item) => item.label),
      ),
  );

  const sidebarLabel = useMemo(() => {
    if (activePane === "explorer") {
      return treeLabel;
    }

    return railItems.find((item) => item.id === activePane)?.label ?? treeLabel;
  }, [activePane, treeLabel]);

  const documentTabs = useMemo(
    () =>
      [
        { id: "editor" as const, label: tabLabel, icon: FileCode2 },
        ...(notesLines?.length
          ? [{ id: "notes" as const, label: notesTitle, icon: FileText }]
          : []),
        ...(settingsLines?.length
          ? [{ id: "settings" as const, label: settingsTitle, icon: FileJson2 }]
          : []),
      ],
    [notesLines?.length, notesTitle, settingsLines?.length, settingsTitle, tabLabel],
  );

  const renderedSearchItems = useMemo(
    () =>
      searchItems ?? [
        `file:${tabLabel}`,
        "filter: active turn",
        "scope: current room",
      ],
    [searchItems, tabLabel],
  );

  const renderedToolsLines = useMemo(
    () =>
      toolsLines ?? [
        "Run code before you submit it.",
        "Autosave keeps your draft safe.",
        "Only the previous step is visible.",
      ],
    [toolsLines],
  );

  const sidebarContent = useMemo(() => {
    switch (activePane) {
      case "search":
        return (
          <div className="space-y-3 px-3 py-3">
            <div className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#8b949e]">
              Find in workspace
            </div>
            {renderedSearchItems.map((entry, index) => (
              <button
                key={entry}
                type="button"
                onClick={() =>
                  setActiveDocument(index === 0 ? "editor" : index === 1 ? "notes" : "settings")
                }
                className="block w-full rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-left text-[0.8rem] text-[#c9d1d9] transition hover:border-[#3a3d41] hover:text-[#e6edf3]"
              >
                {entry}
              </button>
            ))}
          </div>
        );
      case "outline":
        return (
          <div className="space-y-1 px-2 py-3">
            {[
              "workspace",
              "current turn",
              tabLabel,
              "round constraints",
              "relay notes",
            ].map((entry, index) => (
              <button
                key={entry}
                type="button"
                onClick={() =>
                  setActiveDocument(index === 4 ? "notes" : index === 3 ? "settings" : "editor")
                }
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[0.8rem] text-[#9da7b3] transition hover:bg-[#2a2d2e] hover:text-[#e6edf3]",
                  ((index === 4 && activeDocument === "notes") ||
                    (index === 3 && activeDocument === "settings") ||
                    (index <= 2 && activeDocument === "editor")) &&
                    "bg-[#37373d] text-[#e6edf3]",
                )}
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0 text-[#7d8590]" />
                <span className="truncate">{entry}</span>
              </button>
            ))}
          </div>
        );
      case "tools":
        return (
          <div className="space-y-3 px-3 py-3">
            {renderedToolsLines.map((entry) => (
              <div
                key={entry}
                className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-[0.8rem] text-[#c9d1d9]"
              >
                {entry}
              </div>
            ))}
          </div>
        );
      case "settings":
        return (
          <div className="space-y-3 px-3 py-3">
            {[
              "Theme: Relay Night",
              "Tabs: 2 spaces",
              "Wrap: off",
              "Minimap: on",
            ].map((entry) => (
              <div
                key={entry}
                className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-[0.8rem] text-[#c9d1d9]"
              >
                {entry}
              </div>
            ))}
          </div>
        );
      case "explorer":
      default:
        return (
          <div className="space-y-1 px-2 py-3">
            {treeItems.map((item, index) => {
              if (!isTreeItemVisible(treeItems, index, openFolders)) {
                return null;
              }

              const isFolder = item.kind === "folder";
              const isOpen = isFolder ? openFolders.has(item.label) : false;
              const itemDocument = getDocumentForTreeItem(item, tabLabel);
              const isActiveDocument = itemDocument === activeDocument;
              const Icon = isFolder
                ? isOpen
                  ? FolderOpen
                  : Folder
                : itemDocument === "notes"
                  ? FileText
                  : itemDocument === "settings"
                    ? FileJson2
                    : FileCode2;

              return (
                <button
                  key={`${item.depth ?? 0}-${item.label}`}
                  type="button"
                  onClick={() => {
                    if (isFolder) {
                      setOpenFolders((current) => {
                        const next = new Set(current);
                        if (next.has(item.label)) {
                          next.delete(item.label);
                        } else {
                          next.add(item.label);
                        }
                        return next;
                      });
                      return;
                    }

                    if (itemDocument) {
                      setActiveDocument(itemDocument);
                    }
                  }}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[0.82rem] text-[#9da7b3] transition hover:bg-[#2a2d2e] hover:text-[#e6edf3]",
                    isActiveDocument && "bg-[#37373d] text-[#e6edf3]",
                  )}
                  style={{ paddingLeft: `${0.5 + (item.depth ?? 0) * 0.9}rem` }}
                >
                  {isFolder ? (
                    isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#7d8590]" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#7d8590]" />
                    )
                  ) : null}
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#7d8590]" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        );
    }
  }, [
    activeDocument,
    activePane,
    openFolders,
    renderedSearchItems,
    renderedToolsLines,
    tabLabel,
    treeItems,
  ]);

  return (
    <div className={cn("panel-ink min-w-0 overflow-hidden rounded-[16px]", className)}>
      <div className="grid h-8 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#2d2d30] bg-[#181818] px-3 text-[0.72rem] text-[#7d8590]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="truncate text-center font-mono text-[0.68rem] uppercase tracking-[0.14em]">
          {title}
        </span>
        <span className="hidden text-[0.68rem] sm:inline">relay-workspace</span>
      </div>
      <div className="border-b border-[#2d2d30] bg-[#181818] px-3 py-2 xl:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          {railItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activePane;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePane(item.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-[8px] border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition",
                  active
                    ? "border-[#264f78] bg-[#0b2538] text-[#e6edf3]"
                    : "border-[#2d2d30] bg-[#111317] text-[#8b949e] hover:text-[#e6edf3]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid min-h-0 xl:grid-cols-[46px_220px_minmax(0,1fr)]">
        <div className="hidden border-r border-[#2d2d30] bg-[#181818] xl:flex xl:flex-col xl:items-center xl:py-2">
          {railItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activePane;

            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={active}
                onClick={() => setActivePane(item.id)}
                className={cn(
                  "relative mb-1 inline-flex h-11 w-full items-center justify-center text-[#6e7681] transition hover:bg-[#22272e] hover:text-[#e6edf3]",
                  active && "text-[#e6edf3]",
                )}
              >
                {active ? (
                  <span className="absolute left-0 top-2 h-7 w-0.5 rounded-full bg-[#007acc]" />
                ) : null}
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <div className="border-b border-[#2d2d30] bg-[#252526] xl:border-b-0 xl:border-r">
          <div className="border-b border-[#2d2d30] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
            {sidebarLabel}
          </div>
          {sidebarContent}
        </div>
        <div className="min-w-0 bg-[#1e1e1e]">
          <div className="flex items-end gap-1 overflow-x-auto border-b border-[#2d2d30] bg-[#252526] pl-2">
            {documentTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDocument(tab.id)}
                  className={cn(
                    "flex min-w-0 shrink-0 items-center gap-2 rounded-t-[6px] border-x border-t px-3 py-2 text-[0.78rem] transition",
                    activeDocument === tab.id
                      ? "border-[#2d2d30] bg-[#1e1e1e] text-[#e6edf3]"
                      : "border-transparent bg-[#2d2d2d] text-[#8b949e] hover:text-[#e6edf3]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      tab.id === "settings"
                        ? "text-[#4ec9b0]"
                        : tab.id === "notes"
                          ? "text-[#ce9178]"
                          : "text-[#6cb6ff]",
                    )}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="min-h-0 min-w-0">
            {activeDocument === "editor" ? (
              children
            ) : activeDocument === "settings" ? (
              <div className="grid gap-3 bg-[#1e1e1e] px-5 py-4 font-mono text-[13px] leading-7 text-[#c9d1d9]">
                <p className="text-[#4ec9b0]">{`// ${settingsTitle}`}</p>
                {(settingsLines ?? []).map((line, index) => (
                  <p key={`${line}-${index}`} className="whitespace-pre-wrap break-words">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 bg-[#1e1e1e] px-5 py-4 font-mono text-[13px] leading-7 text-[#c9d1d9]">
                <p className="text-[#4ec9b0]">{`# ${notesTitle}`}</p>
                {(notesLines ?? [
                  `active_file: ${tabLabel}`,
                  `workspace: ${title}`,
                  "// Use the rail to inspect search, notes, and settings.",
                ]).map((line, index) => (
                  <p key={`${line}-${index}`} className="whitespace-pre-wrap break-words">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
          {footer ? (
            <div className="border-t border-[#2d2d30] bg-[#181818] px-4 py-2 text-sm text-[#9da7b3]">
              {footer}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 overflow-x-auto bg-[#007acc] px-4 py-1.5 font-mono text-[0.68rem] text-white">
            <div className="flex shrink-0 flex-wrap items-center gap-3">{statusLeft}</div>
            {statusRight ? <div className="flex shrink-0 items-center gap-3">{statusRight}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
