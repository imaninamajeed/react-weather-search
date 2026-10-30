import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertsNextDialog } from "@/components/alerts/alerts-next-dialog";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { placeHref, type Place } from "@/lib/places";

interface AlertsSummaryProps {
  warnings: number;
  advisories: number;
  /** Places that have at least one alert, out of `places`. */
  affected: number;
  places: number;
  /** Places whose alerts couldn't be loaded, so an empty page is not read as "all clear". */
  failed: number;
  /** A feed was down or a place failed: what is shown may be missing something. */
  incomplete: boolean;
  /** The places that were checked, listed on the banner when everything is clear. */
  checked: Place[];
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// The isobars are bright, so the text on the banner carries a soft halo in the panel's own colour,
// as on the dashboard hero.
const halo = "[text-shadow:0_0_14px_var(--halo),0_0_5px_var(--halo)]";

/**
 * The alerts page's banner, drawn like the dashboard's hero: the mark's isobars turn slowly behind it
 * and fade out well before the words. The answer is in words on the left; on the right sit the two
 * counts or, when nothing is active, a shield with a slow ripple, and the places that were checked.
 * It only reports, and the glows are the brand's, never severity, so a page full of warnings is
 * not also a page full of red: severity shows only as an icon and a word on each alert.
 */
export function AlertsSummary({
  warnings,
  advisories,
  affected,
  places,
  failed,
  incomplete,
  checked,
}: AlertsSummaryProps) {
  const none = warnings + advisories === 0;
  const unchecked = none && failed >= places;
  const clear = none && !incomplete;

  const headline = unchecked
    ? "Couldn't check alerts"
    : clear
      ? "All clear"
      : none
        ? "No alerts found"
        : [
            warnings > 0 && plural(warnings, "warning", "warnings"),
            advisories > 0 && plural(advisories, "advisory", "advisories"),
          ]
            .filter(Boolean)
            .join(" and ");
  const placesLabel = places === 1 ? "your place" : `your ${places} places`;
  const lead = unchecked
    ? "Alerts are unavailable right now. Try again in a moment."
    : clear
      ? `No active alerts across ${placesLabel}.`
      : none
        ? "Nothing active in what we could reach, but some checks didn't finish. Details are below."
        : `${affected === places ? "Across all of" : `In ${affected} of`} ${placesLabel}.`;

  return (
    <section
      aria-labelledby="alerts-summary-title"
      className="relative isolate overflow-hidden rounded-4xl bg-card text-card-foreground shadow-md ring-1 ring-foreground/5 [--glow-magenta:12%] [--glow-teal:9%] [--halo:oklch(1_0_0/0.95)] dark:bg-black dark:text-white dark:shadow-none dark:ring-0 dark:[--glow-magenta:26%] dark:[--glow-teal:14%] dark:[--halo:#000]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(55% 90% at 100% 0%, color-mix(in oklch, var(--brand-magenta) var(--glow-magenta), transparent), transparent 70%)",
            "radial-gradient(60% 90% at 0% 100%, color-mix(in oklch, var(--brand-teal) var(--glow-teal), transparent), transparent 70%)",
          ].join(", "),
        }}
      />
      <IsobarMark
        bare
        detail="full"
        className="pointer-events-none absolute -top-24 -right-20 -z-10 size-[26rem] mask-[radial-gradient(closest-side,black_35%,transparent)] opacity-40 motion-safe:animate-[spin_240s_linear_infinite] lg:-top-44 lg:-right-16 lg:size-[36rem] dark:opacity-55"
      />

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <p className={`label-caps text-foreground/75 dark:text-white/90 ${halo}`}>Alerts</p>
          <h2
            id="alerts-summary-title"
            className="mt-3 font-heading text-5xl leading-[0.95] text-balance sm:text-6xl lg:text-7xl"
          >
            {headline}
          </h2>
          <p
            className={`mt-4 max-w-prose text-lg text-muted-foreground dark:text-white/80 ${halo}`}
          >
            {lead}
          </p>

          {clear && checked.length > 0 && (
            <ul aria-label="Places checked" className="mt-6 flex flex-wrap gap-2">
              {checked.map((place) => (
                <li key={place.key}>
                  <Link
                    href={placeHref(place)}
                    className="flex items-center gap-1.5 rounded-full bg-background/70 py-1 pr-3 pl-1.5 text-sm font-medium ring-1 ring-foreground/10 backdrop-blur transition-colors hover:bg-background dark:bg-white/10 dark:ring-white/15 dark:hover:bg-white/15"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-5 place-items-center rounded-full bg-[color-mix(in_oklch,var(--brand-teal-text)_18%,transparent)] text-(--brand-teal-text)"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {place.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {clear && (
            <div className="mt-6">
              <AlertsNextDialog />
            </div>
          )}
        </div>

        {clear ? (
          <div aria-hidden="true" className="relative hidden size-32 place-items-center sm:grid">
            <span className="absolute inset-0 rounded-full bg-(--brand-teal-text)/15 motion-safe:animate-[ping_3.2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <span className="absolute inset-4 rounded-full bg-(--brand-teal-text)/10" />
            <span className="relative grid size-20 place-items-center rounded-full bg-background/80 text-(--brand-teal-text) shadow-lg ring-1 ring-(--brand-teal-text)/30 backdrop-blur dark:bg-black/60">
              <ShieldCheck className="size-10" strokeWidth={1.5} />
            </span>
          </div>
        ) : (
          !none && (
            <dl className="grid grid-cols-2 divide-x divide-border border-t border-border pt-6 lg:border-t-0 lg:pt-0">
              <Figure label="Warnings">{warnings}</Figure>
              <Figure label="Advisories">{advisories}</Figure>
            </dl>
          )
        )}
      </div>
    </section>
  );
}

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-6 first:pl-0 last:pr-0 lg:px-10 lg:first:pl-0 lg:last:pr-0">
      <dt className={`text-sm text-muted-foreground dark:text-white/80 ${halo}`}>{label}</dt>
      <dd className="tnum mt-1 font-heading text-6xl leading-none font-medium">{children}</dd>
    </div>
  );
}
