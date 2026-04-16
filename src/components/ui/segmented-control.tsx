"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<TValue extends string> {
  label: string;
  value: TValue;
}

export function SegmentedControl<TValue extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  options: SegmentedOption<TValue>[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "rounded-[10px] px-3 py-2 text-sm font-semibold transition",
              active
                ? "bg-[color:var(--color-accent)] text-white"
                : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-elevated)] hover:text-[color:var(--color-text-strong)]",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
