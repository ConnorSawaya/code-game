import type { ReactNode } from "react";
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

const railIcons = [Files, Search, Blocks, Wrench, Settings2];

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
  return (
    <div className={cn("panel-ink overflow-hidden rounded-[16px]", className)}>
      <div className="flex h-8 items-center justify-between border-b border-[#2d2d30] bg-[#181818] px-3 text-[0.72rem] text-[#7d8590]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em]">
          {title}
        </span>
        <span className="hidden sm:inline text-[0.68rem]">relay-workspace</span>
      </div>
      <div className="grid min-h-0 lg:grid-cols-[48px_220px_minmax(0,1fr)]">
        <div className="hidden border-r border-[#2d2d30] bg-[#181818] lg:flex lg:flex-col lg:items-center lg:py-2">
          {railIcons.map((Icon, index) => (
            <div
              key={index}
              className={cn(
                "relative mb-1 inline-flex h-11 w-full items-center justify-center text-[#6e7681]",
                index === 0 && "text-[#e6edf3]",
              )}
            >
              {index === 0 ? (
                <span className="absolute left-0 top-2 h-7 w-0.5 rounded-full bg-[#007acc]" />
              ) : null}
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </div>
        <div className="hidden border-r border-[#2d2d30] bg-[#252526] lg:block">
          <div className="border-b border-[#2d2d30] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
            {treeLabel}
          </div>
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
        </div>
        <div className="min-w-0 bg-[#1e1e1e]">
          <div className="flex items-end border-b border-[#2d2d30] bg-[#252526] pl-2">
            <div className="flex min-w-0 items-center gap-2 rounded-t-[6px] border-x border-t border-[#2d2d30] bg-[#1e1e1e] px-3 py-2 text-[0.78rem] text-[#e6edf3]">
              <FileCode2 className="h-3.5 w-3.5 text-[#6cb6ff]" />
              <span className="truncate">{tabLabel}</span>
            </div>
            <div className="hidden px-3 py-2 text-[0.78rem] text-[#7d8590] md:block">
              README.md
            </div>
          </div>
          <div className="min-h-0">{children}</div>
          {footer ? (
            <div className="border-t border-[#2d2d30] bg-[#181818] px-4 py-2 text-sm text-[#9da7b3]">
              {footer}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#007acc] px-4 py-1.5 font-mono text-[0.68rem] text-white">
            <div className="flex flex-wrap items-center gap-3">{statusLeft}</div>
            {statusRight ? <div className="flex items-center gap-3">{statusRight}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
