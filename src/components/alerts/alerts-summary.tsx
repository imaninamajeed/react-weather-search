import { OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PlaceCount {
  key: string;
  name: string;
  warnings: number;
  advisories: number;
}

interface AlertsSummaryProps {
  warnings: number;
  advisories: number;
  /** Places that have at least one alert, out of `places`. */
  affected: number;
  places: number;
  /** Each followed place with what it has under the current filter. */
  byPlace: PlaceCount[];
  totalAll: number;
  totalOfficial: number;
  officialOnly: boolean;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// The glows and isobars are bright, so the info text carries a soft halo in the panel's own colour
// (--halo: white by day, black by night), as on the dashboard hero, wherever it crosses the art.
const halo = "[text-shadow:0_0_14px_var(--halo),0_0_5px_var(--halo)]";

/**
 * The alerts page's hero, built like the dashboard's: the answer on the left, one big number on the
 * right, and a strip along the foot. The big number is how many alerts are active, over the turning
 * isobars; the glow in the corner takes the colour of the most serious alert (red, amber, or the
 * brand teal when all is clear), so the mood of the page is felt before a word is read. The strip
 * names each place you follow and what it has, each a link to its alerts below.
 */
export function AlertsSummary({
  warnings,
  advisories,
  affected,
  places,
  byPlace,
  totalAll,
  totalOfficial,
  officialOnly,
}: AlertsSummaryProps) {
  const total = warnings + advisories;
  const clear = total === 0;
  const tone = clear ? "var(--brand-teal)" : warnings > 0 ? "var(--warning)" : "var(--advisory)";

  const headline = clear
    ? "All clear"
    : [
        warnings > 0 && plural(warnings, "warning", "warnings"),
        advisories > 0 && plural(advisories, "advisory", "advisories"),
      ]
        .filter(Boolean)
        .join(" and ");
  const placesLabel = places === 1 ? "your place" : `your ${places} places`;
  const lead = clear
    ? `No active alerts across ${placesLabel}.`
    : `${affected === places ? "Across all of" : `In ${affected} of`} ${placesLabel}.`;

  return (
    <section
      aria-labelledby="alerts-summary-title"
      style={{ "--tone": tone } as CSSProperties}
      className="relative isolate overflow-hidden rounded-4xl bg-card text-card-foreground shadow-md ring-1 ring-foreground/5 [--glow-magenta:12%] [--glow-tone:16%] [--halo:oklch(1_0_0/0.95)] dark:bg-black dark:text-white dark:shadow-none dark:ring-0 dark:[--glow-magenta:30%] dark:[--glow-tone:22%] dark:[--halo:#000]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(55% 90% at 100% 0%, color-mix(in oklch, var(--brand-magenta) var(--glow-magenta), transparent), transparent 70%)",
            "radial-gradient(60% 90% at 0% 100%, color-mix(in oklch, var(--tone) var(--glow-tone), transparent), transparent 70%)",
          ].join(", "),
        }}
      />
      <IsobarMark
        bare
        detail="full"
        className="pointer-events-none absolute -top-28 -right-24 -z-10 size-120 mask-[radial-gradient(closest-side,black_35%,transparent)] opacity-40 motion-safe:animate-[spin_240s_linear_infinite] lg:-top-48 lg:size-152 dark:opacity-55"
      />

      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_auto] lg:items-end fit:p-5">
        <div className="min-w-0">
          <p
            className={`font-heading text-xs font-medium tracking-[0.08em] text-foreground/75 uppercase dark:text-white/90 ${halo}`}
          >
            Alerts
          </p>
          <h2
            id="alerts-summary-title"
            className="mt-3 font-heading text-5xl leading-[0.95] text-balance sm:text-6xl lg:text-7xl"
          >
            {headline}
          </h2>
          <p className={`mt-4 max-w-prose text-lg text-foreground/85 dark:text-white/90 ${halo}`}>
            {lead}
          </p>

          <nav aria-label="Filter Alerts" className="mt-6 flex flex-wrap items-center gap-2">
            <FilterLink href="/alerts" active={!officialOnly}>
              All Alerts ({totalAll})
            </FilterLink>
            <FilterLink href="/alerts?show=official" active={officialOnly}>
              Official Warnings ({totalOfficial})
            </FilterLink>
          </nav>
        </div>

        <div>
          <p className="font-heading text-8xl leading-none font-medium tracking-tight tabular-nums sm:text-9xl dark:[text-shadow:0_0_36px_color-mix(in_oklch,var(--tone)_60%,transparent)]">
            <span className="sr-only">{plural(total, "active alert", "active alerts")}</span>
            <span aria-hidden="true">{total}</span>
          </p>
          <p aria-hidden="true" className={`mt-2 text-lg ${halo}`}>
            Active {total === 1 ? "Alert" : "Alerts"}
          </p>
        </div>
      </div>

      {places > 1 && (
        <div className="border-t border-border px-6 pt-4 pb-5 dark:border-white/10 fit:pb-4">
          <ul aria-label="Alerts by Place" className="flex flex-wrap gap-2">
            {byPlace.map((place) => (
              <li key={place.key}>
                <PlaceChip place={place} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const chip =
  "flex items-center gap-1.5 rounded-full border border-border bg-background/70 py-1.5 pr-3.5 pl-2.5 text-sm dark:border-white/15 dark:bg-white/5";

/** One place in the strip: its worst alert as icon and word, and how many; a link to them when there are any. */
function PlaceChip({ place }: { place: PlaceCount }) {
  const count = place.warnings + place.advisories;
  if (count === 0) {
    return (
      <span className={cn(chip, "text-muted-foreground dark:text-white/80")}>
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-(--brand-teal-text)" />
        <span className="font-medium text-foreground dark:text-white">{place.name}</span>
        Clear
      </span>
    );
  }
  const isWarning = place.warnings > 0;
  const Icon = isWarning ? OctagonAlert : TriangleAlert;
  return (
    <Link
      href={`#alerts-${place.key}`}
      className={cn(chip, "transition-colors hover:bg-background dark:hover:bg-white/15")}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0",
          isWarning ? "text-warning" : "text-advisory-foreground dark:text-advisory",
        )}
      />
      <span className="sr-only">{isWarning ? "Warning" : "Advisory"}: </span>
      <span className="font-medium">{place.name}</span>
      <span className="text-muted-foreground tabular-nums dark:text-white/80">{count}</span>
    </Link>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      asChild
      size="lg"
      variant={active ? "default" : "outline"}
      className={cn(
        !active &&
          "dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 dark:hover:text-white",
      )}
    >
      <Link href={href} aria-current={active ? "page" : undefined}>
        {children}
      </Link>
    </Button>
  );
}
