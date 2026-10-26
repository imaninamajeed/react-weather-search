import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/lib/weather/confidence";

const FILLED: Record<ConfidenceLevel, number> = { high: 3, medium: 2, low: 1 };
export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Three dots, filled by confidence. Always shown beside the word, so it never relies on shape alone. */
export function ConfidenceDots({ level }: { level: ConfidenceLevel | null }) {
  const filled = level ? FILLED[level] : 0;
  return (
    <span aria-hidden="true" className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("size-2 rounded-full", i < filled ? "bg-foreground" : "bg-border")}
        />
      ))}
    </span>
  );
}
