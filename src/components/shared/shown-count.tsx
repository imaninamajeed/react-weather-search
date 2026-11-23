"use client";

import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Past this many ticks the row stops growing; the words still say the exact count. */
const MAX_TICKS = 12;

/**
 * "Showing 4 of 5 other locations", with one small tick per item: solid for those
 * shown, hollow for those left out. It says a list is capped, and by how much, without competing with
 * the list. The ticks are decoration; the sentence carries the meaning.
 */
export function ShownCount({
  shown,
  total,
  noun,
  order,
  className,
}: {
  shown: number;
  total: number;
  /** What is being counted, after "of N", e.g. "other locations". Omit for a bare count. */
  noun?: string;
  /** Only for a list whose order is not what you would expect, e.g. "newest first". Usually omit. */
  order?: string;
  className?: string;
}) {
  const t = useMessages();
  const ticks = Math.min(total, MAX_TICKS);
  return (
    <div
      className={cn("flex items-center justify-end gap-3 text-xs text-muted-foreground", className)}
    >
      <span className="tnum">
        {t.common.showing} <span className="font-medium text-foreground">{shown}</span>{" "}
        {t.common.showingOf} {total}
        {noun ? ` ${noun}` : ""}
        {order ? ` · ${order}` : ""}
      </span>
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: ticks }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 w-3 rounded-full",
              index < shown ? "bg-foreground/50" : "bg-border",
            )}
          />
        ))}
      </span>
    </div>
  );
}
