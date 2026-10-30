import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AlertsNextDialog } from "@/components/alerts/alerts-next-dialog";
import { BannerFigures, PageBanner } from "@/components/shared/page-banner";
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

/**
 * The alerts page's banner (see PageBanner). The answer is in words on the left; on the right sit the
 * two counts or, when nothing is active, a shield with a slow ripple, and the places that were checked.
 * It only reports: severity shows only as an icon and a word on each alert.
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
    <PageBanner
      id="alerts-summary"
      label="Alerts"
      title={headline}
      lead={lead}
      aside={
        clear ? (
          <div aria-hidden="true" className="relative hidden size-32 place-items-center sm:grid">
            <span className="absolute inset-0 rounded-full bg-(--brand-teal-text)/15 motion-safe:animate-[ping_3.2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <span className="absolute inset-4 rounded-full bg-(--brand-teal-text)/10" />
            <span className="relative grid size-20 place-items-center rounded-full bg-background/80 text-(--brand-teal-text) shadow-lg ring-1 ring-(--brand-teal-text)/30 backdrop-blur dark:bg-black/60">
              <ShieldCheck className="size-10" strokeWidth={1.5} />
            </span>
          </div>
        ) : (
          !none && (
            <BannerFigures
              figures={[
                { label: "Warnings", value: warnings },
                { label: "Advisories", value: advisories },
              ]}
            />
          )
        )
      }
    >
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
    </PageBanner>
  );
}
