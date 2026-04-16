"use client";

import { cn } from "@/lib/utils";

export function SelectableChip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-[10px] border px-3 py-2 text-sm font-medium transition",
        selected
          ? "border-[rgba(0,122,204,0.65)] bg-[rgba(0,122,204,0.18)] text-[color:var(--color-text-strong)]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text)]",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
