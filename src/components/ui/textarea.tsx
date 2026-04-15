import type { ComponentProps } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  minRows = 4,
  ...props
}: ComponentProps<typeof TextareaAutosize>) {
  return (
    <TextareaAutosize
      minRows={minRows}
      className={cn(
        "w-full rounded-[22px] border border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,241,228,0.96))] px-4 py-3 text-sm leading-7 text-[color:var(--color-ink)] shadow-[var(--shadow-press)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cobalt)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] placeholder:text-[color:var(--color-muted)]/70",
        className,
      )}
      {...props}
    />
  );
}
