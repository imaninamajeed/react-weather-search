import type { ReactNode } from "react";

interface AlertsSummaryProps {
  warnings: number;
  advisories: number;
  /** Places that have at least one alert, out of `places`. */
  affected: number;
  places: number;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The alerts page's banner: a flat card with the answer in words on the left and the two counts on
 * the right, split by hairlines. It only reports; the filter and the alerts sit below it. It uses the
 * card surface and nothing else (no art, no tint), so severity shows only as an icon and a word on
 * each alert, and a page full of warnings is not also a page full of red.
 */
export function AlertsSummary({ warnings, advisories, affected, places }: AlertsSummaryProps) {
  const clear = warnings + advisories === 0;

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
      className="grid gap-6 rounded-4xl bg-card p-6 text-card-foreground shadow-md ring-1 ring-foreground/5 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 dark:ring-foreground/10 fit:py-6"
    >
      <div className="min-w-0">
        <p className="label-caps">Alerts</p>
        <h2
          id="alerts-summary-title"
          className="mt-2 font-heading text-3xl leading-tight text-balance sm:text-4xl"
        >
          {headline}
        </h2>
        <p className="mt-2 text-muted-foreground">{lead}</p>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-border border-t border-border pt-6 lg:border-t-0 lg:pt-0">
        <Figure label="Warnings">{warnings}</Figure>
        <Figure label="Advisories">{advisories}</Figure>
      </dl>
    </section>
  );
}

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-6 first:pl-0 last:pr-0 lg:px-10 lg:first:pl-0 lg:last:pr-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="tnum mt-1 font-heading text-5xl leading-none font-medium">{children}</dd>
    </div>
  );
}
