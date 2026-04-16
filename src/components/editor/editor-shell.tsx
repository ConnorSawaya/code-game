"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Blocks,
  FileCode2,
  Files,
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
}

type RailPaneId = "explorer" | "search" | "outline" | "tools" | "settings";

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

export function EditorShell({
  title,
  tabLabel,
  statusLeft,
  statusRight,
  treeLabel = "Explorer",
  treeItems,
  children,
  footer,
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
  className?: string;
}) {
  const [activePane, setActivePane] = useState<RailPaneId>("explorer");
  const [activeTab, setActiveTab] = useState<"editor" | "notes">("editor");

  const sidebarLabel = useMemo(() => {
    if (activePane === "explorer") {
      return treeLabel;
    }

    return railItems.find((item) => item.id === activePane)?.label ?? treeLabel;
  }, [activePane, treeLabel]);

  const sidebarContent = useMemo(() => {
    switch (activePane) {
      case "search":
        return (
          <div className="space-y-3 px-3 py-3">
            <div className="rounded-[8px] border border-[#2d2d30] bg-[#1f1f1f] px-3 py-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#8b949e]">
              Find in workspace
            </div>
            {[
              `file:${tabLabel}`,
              "filter: active turn",
              "scope: current room",
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
              <div
                key={entry}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-[6px] px-2 text-[0.8rem] text-[#9da7b3]",
                  index === 2 && "bg-[#37373d] text-[#e6edf3]",
                )}
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0 text-[#7d8590]" />
                <span className="truncate">{entry}</span>
              </div>
            ))}
          </div>
        );
      case "tools":
        return (
          <div className="space-y-3 px-3 py-3">
            {[
              "Preview toggle ready",
              "Autosave draft active",
              "Only the last step is visible",
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
            {treeItems.map((item) => (
              <div
                key={`${item.depth ?? 0}-${item.label}`}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-[6px] px-2 text-[0.82rem] text-[#9da7b3]",
                  item.active && "bg-[#37373d] text-[#e6edf3]",
                )}
                style={{ paddingLeft: `${0.5 + (item.depth ?? 0) * 0.9}rem` }}
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0 text-[#7d8590]" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        );
    }
  }, [activePane, tabLabel, treeItems]);

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
      <div className="grid min-h-0 xl:grid-cols-[46px_208px_minmax(0,1fr)]">
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
        <div className="hidden border-r border-[#2d2d30] bg-[#252526] xl:block">
          <div className="border-b border-[#2d2d30] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
            {sidebarLabel}
          </div>
          {sidebarContent}
        </div>
        <div className="min-w-0 bg-[#1e1e1e]">
          <div className="flex items-end gap-1 overflow-x-auto border-b border-[#2d2d30] bg-[#252526] pl-2">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={cn(
                "flex min-w-0 shrink-0 items-center gap-2 rounded-t-[6px] border-x border-t px-3 py-2 text-[0.78rem] transition",
                activeTab === "editor"
                  ? "border-[#2d2d30] bg-[#1e1e1e] text-[#e6edf3]"
                  : "border-transparent bg-[#2d2d2d] text-[#8b949e] hover:text-[#e6edf3]",
              )}
            >
              <FileCode2 className="h-3.5 w-3.5 text-[#6cb6ff]" />
              <span className="truncate">{tabLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={cn(
                "hidden shrink-0 rounded-t-[6px] border-x border-t px-3 py-2 text-[0.78rem] transition md:block",
                activeTab === "notes"
                  ? "border-[#2d2d30] bg-[#1e1e1e] text-[#e6edf3]"
                  : "border-transparent bg-[#2d2d2d] text-[#7d8590] hover:text-[#e6edf3]",
              )}
            >
              README.md
            </button>
          </div>
          <div className="min-h-0 min-w-0">
            {activeTab === "editor" ? (
              children
            ) : (
              <div className="grid gap-4 bg-[#1e1e1e] px-5 py-4 font-mono text-[13px] leading-7 text-[#c9d1d9]">
                <p className="text-[#4ec9b0]"># Relay workspace notes</p>
                <p>
                  <span className="text-[#569cd6]">active_file</span>
                  <span className="text-[#d4d4d4]">:</span>{" "}
                  <span className="text-[#ce9178]">{tabLabel}</span>
                </p>
                <p>
                  <span className="text-[#569cd6]">workspace</span>
                  <span className="text-[#d4d4d4]">:</span>{" "}
                  <span className="text-[#ce9178]">{title}</span>
                </p>
                <p className="text-[#6a9955]">
                  {"// Use the left rail to inspect search, outline, tools, and settings."}
                </p>
                <p className="text-[#6a9955]">
                  {"// Relay only shows the previous step until the reveal stage."}
                </p>
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
