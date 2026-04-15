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
        "inline-flex flex-wrap gap-2 rounded-[20px] border border-[color:var(--color-border)] bg-[rgba(255,255,255,0.58)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
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
              "rounded-[16px] px-3.5 py-2 text-sm font-semibold transition",
              active
                ? "bg-[linear-gradient(180deg,var(--color-cobalt),var(--color-cobalt-strong))] text-white shadow-[0_16px_28px_rgba(53,90,216,0.22)]"
                : "text-[color:var(--color-muted)] hover:bg-white/90 hover:text-[color:var(--color-ink)]",
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
