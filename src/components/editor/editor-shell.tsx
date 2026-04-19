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

export type EditorFileKind = "code" | "markdown" | "json" | "text";
export type EditorRailPaneId =
  | "explorer"
  | "search"
  | "outline"
  | "tools"
  | "settings";

export interface EditorTreeItem {
  id: string;
  label: string;
  depth?: number;
  kind?: "file" | "folder";
  fileKind?: EditorFileKind;
}

export interface EditorTabItem {
  id: string;
  label: string;
  fileKind?: EditorFileKind;
}

export interface EditorSidebarEntry {
  id: string;
  label: string;
  targetId?: string;
}

const railItems: Array<{
  id: EditorRailPaneId;
  label: string;
  icon: typeof Files;
}> = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "outline", label: "Outline", icon: Blocks },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings2 },
];

function renderFileIcon(kind: EditorFileKind | undefined) {
  if (kind === "json") {
    return FileJson2;
  }

  if (kind === "markdown" || kind === "text") {
    return FileText;
  }

  return FileCode2;
}

function isTreeItemVisible(
  treeItems: EditorTreeItem[],
  index: number,
  openFolders: Set<string>,
) {
  let currentDepth = treeItems[index]?.depth ?? 0;

  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const candidate = treeItems[cursor];
    const candidateDepth = candidate.depth ?? 0;

    if (candidateDepth < currentDepth && candidate.kind === "folder") {
      if (!openFolders.has(candidate.id)) {
        return false;
      }

      currentDepth = candidateDepth;
    }
  }

  return true;
}

export function EditorShell({
  title,
  workspaceLabel = "relay-workspace",
  activeTabId,
  onTabChange,
  tabs,
  treeLabel = "Explorer",
  treeItems,
  searchItems,
  outlineItems,
  toolsLines,
  railSettingsPanel,
  explorerAction,
  content,
  contentMinHeight,
  footer,
  statusLeft,
  statusRight,
  panel,
  panelPosition = "bottom",
  panelClassName,
  className,
}: {
  title: string;
  workspaceLabel?: string;
  activeTabId: string;
  onTabChange: (id: string) => void;
  tabs: EditorTabItem[];
  treeLabel?: string;
  treeItems: EditorTreeItem[];
  searchItems?: EditorSidebarEntry[];
  outlineItems?: EditorSidebarEntry[];
  toolsLines?: string[];
  railSettingsPanel?: ReactNode;
  explorerAction?: ReactNode;
  content: ReactNode;
  contentMinHeight?: number;
  footer?: ReactNode;
  statusLeft: ReactNode;
  statusRight?: ReactNode;
  panel?: ReactNode;
  panelPosition?: "right" | "bottom";
  panelClassName?: string;
  className?: string;
}) {
  const [activePane, setActivePane] = useState<EditorRailPaneId>("explorer");
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    () =>
      new Set(
        treeItems
          .filter((item) => item.kind === "folder")
          .map((item) => item.id),
      ),
  );

  const sidebarLabel = useMemo(() => {
    if (activePane === "explorer") {
      return treeLabel;
    }

    return railItems.find((item) => item.id === activePane)?.label ?? treeLabel;
  }, [activePane, treeLabel]);

  const renderedSearchItems = useMemo(
    () =>
      searchItems ?? [
        { id: "active-file", label: "file: active turn", targetId: activeTabId },
        { id: "scope", label: "scope: current room" },
        { id: "filter", label: "filter: visible handoff" },
      ],
    [activeTabId, searchItems],
  );

  const renderedOutlineItems = useMemo(
    () =>
      outlineItems ?? [
        { id: "workspace", label: "workspace", targetId: activeTabId },
        { id: "constraints", label: "round constraints" },
        { id: "notes", label: "relay notes" },
      ],
    [activeTabId, outlineItems],
  );

  const renderedToolsLines = useMemo(
    () =>
      toolsLines ?? [
        "Run the current file before you lock it in.",
        "The explorer follows the active turn language.",
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
            {renderedSearchItems.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => entry.targetId && onTabChange(entry.targetId)}
                className="block w-full rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-left text-[0.8rem] text-[#c9d1d9] transition hover:border-[#3a3d41] hover:text-[#e6edf3]"
              >
                {entry.label}
              </button>
            ))}
          </div>
        );
      case "outline":
        return (
          <div className="space-y-1 px-2 py-3">
            {renderedOutlineItems.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => entry.targetId && onTabChange(entry.targetId)}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[0.8rem] text-[#9da7b3] transition hover:bg-[#2a2d2e] hover:text-[#e6edf3]",
                  entry.targetId === activeTabId && "bg-[#37373d] text-[#e6edf3]",
                )}
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0 text-[#7d8590]" />
                <span className="truncate">{entry.label}</span>
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
            {railSettingsPanel ?? (
              <div className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 text-[0.8rem] text-[#c9d1d9]">
                Open <span className="font-mono text-[#e6edf3]">room.settings.json</span> to tune the
                workspace.
              </div>
            )}
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
              const isOpen = isFolder ? openFolders.has(item.id) : false;
              const Icon = isFolder
                ? isOpen
                  ? FolderOpen
                  : Folder
                : renderFileIcon(item.fileKind);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (isFolder) {
                      setOpenFolders((current) => {
                        const next = new Set(current);
                        if (next.has(item.id)) {
                          next.delete(item.id);
                        } else {
                          next.add(item.id);
                        }
                        return next;
                      });
                      return;
                    }

                    onTabChange(item.id);
                  }}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[0.82rem] text-[#9da7b3] transition hover:bg-[#2a2d2e] hover:text-[#e6edf3]",
                    !isFolder && activeTabId === item.id && "bg-[#37373d] text-[#e6edf3]",
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
    activePane,
    activeTabId,
    onTabChange,
    openFolders,
    railSettingsPanel,
    renderedOutlineItems,
    renderedSearchItems,
    renderedToolsLines,
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
        <span className="hidden truncate text-[0.68rem] sm:inline">{workspaceLabel}</span>
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
          <div className="flex items-center justify-between gap-3 border-b border-[#2d2d30] px-4 py-3">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              {sidebarLabel}
            </span>
            {activePane === "explorer" ? explorerAction : null}
          </div>
          {sidebarContent}
        </div>
        <div className="min-w-0 bg-[#1e1e1e]">
          <div className="flex items-end gap-1 overflow-x-auto border-b border-[#2d2d30] bg-[#252526] pl-2">
            {tabs.map((tab) => {
              const Icon = renderFileIcon(tab.fileKind);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex min-w-0 shrink-0 items-center gap-2 rounded-t-[6px] border-x border-t px-3 py-2 text-[0.78rem] transition",
                    activeTabId === tab.id
                      ? "border-[#2d2d30] bg-[#1e1e1e] text-[#e6edf3]"
                      : "border-transparent bg-[#2d2d2d] text-[#8b949e] hover:text-[#e6edf3]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      tab.fileKind === "json"
                        ? "text-[#4ec9b0]"
                        : tab.fileKind === "markdown" || tab.fileKind === "text"
                          ? "text-[#ce9178]"
                          : "text-[#6cb6ff]",
                    )}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="min-h-0 min-w-0" style={contentMinHeight ? { minHeight: contentMinHeight } : undefined}>
            {panel ? (
              <div
                className={cn(
                  "grid min-h-0 min-w-0",
                  panelPosition === "right" && "xl:grid-cols-[minmax(0,1fr)_340px]",
                )}
                style={contentMinHeight ? { minHeight: contentMinHeight } : undefined}
              >
                <div className="min-w-0">{content}</div>
                <div
                  className={cn(
                    "min-h-0 min-w-0 border-t border-[#2d2d30] bg-[#111317]",
                    panelPosition === "right" && "xl:border-l xl:border-t-0",
                    panelClassName,
                  )}
                >
                  {panel}
                </div>
              </div>
            ) : (
              content
            )}
          </div>
          {footer ? (
            <div className="border-t border-[#2d2d30] bg-[#181818] px-4 py-2 text-sm text-[#9da7b3]">
              {footer}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 overflow-x-auto bg-[#007acc] px-4 py-1.5 font-mono text-[0.68rem] text-white">
            <div className="flex shrink-0 flex-wrap items-center gap-3">{statusLeft}</div>
            {statusRight ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3">{statusRight}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
