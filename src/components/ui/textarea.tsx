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
        "w-full rounded-[24px] border border-[color:var(--color-border)] bg-white/90 px-4 py-3 text-sm leading-7 text-[color:var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cobalt)] placeholder:text-[color:var(--color-muted)]/70",
        className,
      )}
      {...props}
    />
  );
}
