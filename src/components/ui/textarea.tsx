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
        "w-full rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-3.5 py-3 text-sm leading-7 text-[color:var(--color-text-strong)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-main)] placeholder:text-[color:var(--color-text-muted)]",
        className,
      )}
      {...props}
    />
  );
}
