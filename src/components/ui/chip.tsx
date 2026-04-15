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
        "rounded-full border px-3.5 py-2 text-sm font-medium transition",
        selected
          ? "border-transparent bg-[linear-gradient(180deg,var(--color-cobalt),var(--color-cobalt-strong))] text-white shadow-[0_14px_24px_rgba(53,90,216,0.22)]"
          : "border-[color:var(--color-border)] bg-white/88 text-[color:var(--color-muted)] shadow-[0_8px_16px_rgba(31,36,48,0.06)] hover:text-[color:var(--color-ink)]",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
