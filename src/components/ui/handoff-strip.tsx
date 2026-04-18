"use client";

import { cn } from "@/lib/utils";

type HandoffItem = {
  label: string;
  hint?: string;
};

export function HandoffStrip({
  items,
  activeIndex,
  orientation = "horizontal",
  compact = false,
  className,
}: {
  items: HandoffItem[];
  activeIndex: number;
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
  className?: string;
}) {
  const vertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex min-w-0",
        vertical ? "flex-col gap-2.5" : "flex-wrap items-start gap-2",
        className,
      )}
    >
      {items.map((item, index) => {
        const state =
          index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming";

        return (
          <div
            key={`${item.label}-${index}`}
            className={cn(
              "flex min-w-0",
              vertical ? "items-stretch gap-3" : "flex-1 items-center gap-2.5",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-center",
                vertical ? "flex-col" : "flex-1",
              )}
            >
              <div
                className={cn(
                  "shrink-0 rounded-full border transition",
                  state === "active"
                    ? "h-3 w-9 border-[rgba(24,144,241,0.75)] bg-[linear-gradient(90deg,#1890f1,#6cb6ff)] shadow-[0_0_18px_rgba(24,144,241,0.28)]"
                    : state === "done"
                      ? "h-3 w-3 border-[rgba(46,160,67,0.55)] bg-[#2ea043]"
                      : "h-3 w-3 border-[rgba(125,133,144,0.45)] bg-transparent",
                )}
              />
              {index < items.length - 1 ? (
                <div
                  className={cn(
                    "shrink-0",
                    vertical
                      ? "mt-2 h-8 w-px bg-[linear-gradient(180deg,rgba(24,144,241,0.55),rgba(45,54,61,0.2))]"
                      : "mx-2 h-px flex-1 bg-[linear-gradient(90deg,rgba(24,144,241,0.5),rgba(45,54,61,0.2))]",
                  )}
                />
              ) : null}
            </div>
            <div className={cn("min-w-0", !vertical && "max-w-[10rem]")}>
              <p
                className={cn(
                  "font-mono uppercase tracking-[0.14em]",
                  compact ? "text-[0.62rem]" : "text-[0.66rem]",
                  state === "active"
                    ? "text-[#e6edf3]"
                    : state === "done"
                      ? "text-[#9fddb1]"
                      : "text-[#7d8590]",
                )}
              >
                {item.label}
              </p>
              {!compact && item.hint ? (
                <p className="mt-1 text-sm leading-5 text-[#9da7b3]">{item.hint}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
