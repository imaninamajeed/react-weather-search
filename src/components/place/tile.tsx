import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Meter, arrow, or other supporting graphic between the value and the caption. */
  children?: ReactNode;
  caption?: ReactNode;
  className?: string;
}

/** One reading in the conditions grid. */
export function Tile({ label, value, unit, children, caption, className }: TileProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card/60 p-4", className)}>
      <p className="label-caps">{label}</p>
      <p className="mt-2 text-3xl leading-none font-semibold">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
      </p>
      {children}
      {caption && <p className="mt-3 text-sm text-muted-foreground">{caption}</p>}
    </div>
  );
}

// Full class names so Tailwind can see them; the track is a lighter wash of the fill.
const TONES = {
  good: { fill: "bg-chart-4", track: "bg-chart-4/20" },
  advisory: { fill: "bg-advisory", track: "bg-advisory/25" },
  warning: { fill: "bg-warning", track: "bg-warning/20" },
} as const;

export type MeterTone = keyof typeof TONES;

/** A horizontal meter whose fill colour carries severity (always paired with a text label). */
export function Meter({
  value,
  max,
  tone,
  label,
}: {
  value: number;
  max: number;
  tone: MeterTone;
  label: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn("mt-3 h-1.5 overflow-hidden rounded-full", TONES[tone].track)}
    >
      <div
        className={cn("h-full rounded-full", TONES[tone].fill)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
