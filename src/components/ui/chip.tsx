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
        "rounded-full border px-3 py-1.5 text-sm transition",
        selected
          ? "border-transparent bg-[color:var(--color-cobalt)] text-white shadow-[0_10px_20px_rgba(76,104,200,0.2)]"
          : "border-[color:var(--color-border)] bg-white/85 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
