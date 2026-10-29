import type { Icon } from "@tabler/icons-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The surface every reading sits on: inset in its card, with the card's own hairline ring. */
export const PANEL =
  "rounded-3xl bg-muted/50 p-4 ring-1 ring-foreground/5 dark:bg-white/5 dark:ring-white/10";

/** A round chip for a reading's icon, tinted by one of the app mark's colours. */
export function IconChip({ icon: ChipIcon, accent }: { icon: Icon; accent: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ "--accent-color": accent } as CSSProperties}
      className="grid size-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--accent-color)_16%,transparent)] text-[color-mix(in_oklch,var(--accent-color)_70%,var(--foreground))]"
    >
      <ChipIcon className="size-4" />
    </span>
  );
}

interface TileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Meter, arrow, or other supporting graphic between the value and the caption. */
  children?: ReactNode;
  caption?: ReactNode;
  /** With `accent`, puts a tinted icon chip before the label. */
  icon?: Icon;
  /** One of the app mark's colours, for the icon chip. */
  accent?: string;
  className?: string;
}

/** One reading in the conditions grid. */
export function Tile({
  label,
  value,
  unit,
  children,
  caption,
  icon,
  accent,
  className,
}: TileProps) {
  return (
    <div className={cn(PANEL, className)}>
      <p className="label-caps flex items-center gap-2">
        {icon && accent && <IconChip icon={icon} accent={accent} />}
        {label}
      </p>
      <p className="mt-3 text-3xl leading-none font-semibold tabular-nums">
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
