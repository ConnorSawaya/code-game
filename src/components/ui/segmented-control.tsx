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
        "inline-flex flex-wrap gap-2 rounded-[22px] border border-[color:var(--color-border)] bg-white/70 p-1.5",
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
              "rounded-[18px] px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-[color:var(--color-ink)] text-white shadow-[0_14px_26px_rgba(31,36,48,0.16)]"
                : "text-[color:var(--color-muted)] hover:bg-white hover:text-[color:var(--color-ink)]",
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
