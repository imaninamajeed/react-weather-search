import { IconCheck } from "@tabler/icons-react";
import Link from "next/link";
import { AlertsNextDialog } from "@/components/alerts/alerts-next-dialog";
import { AllClearArt } from "@/components/shared/illustrations";
import { BannerFigures, PageBanner } from "@/components/shared/page-banner";
import { getI18n } from "@/lib/i18n/server";
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

/**
 * The alerts page's banner (see PageBanner). The answer is in words on the left; on the right sit the
 * two counts or, when nothing is active, a clear-sky illustration, and the places that were checked.
 * The sky follows the answer (a storm for warnings, rain for advisories, clear when all is quiet), but
 * only as mood: severity shows as an icon and a word on each alert.
 */
export async function AlertsSummary({
  warnings,
  advisories,
  affected,
  places,
  failed,
  incomplete,
  checked,
}: AlertsSummaryProps) {
  const { t } = await getI18n();
  const text = t.alerts.summary;
  const none = warnings + advisories === 0;
  const unchecked = none && failed >= places;
  const clear = none && !incomplete;

  const headline = unchecked
    ? text.couldntCheck
    : clear
      ? text.allClear
      : none
        ? text.noneFound
        : [
            warnings > 0 && t.common.warnings(warnings),
            advisories > 0 && t.common.advisories(advisories),
          ]
            .filter(Boolean)
            .join(t.dashboard.overview.and);
  const placesLabel = places === 1 ? text.yourLocation : text.yourLocations(places);
  const lead = unchecked
    ? text.unavailable
    : clear
      ? text.noActive(placesLabel)
      : none
        ? text.incomplete
        : affected === places
          ? text.acrossAll(placesLabel)
          : text.inSome(affected, placesLabel);

  const palette =
    warnings > 0 ? "storm" : advisories > 0 ? "rain-day" : clear ? "clear-day" : "overcast-day";

  return (
    <PageBanner
      id="alerts-summary"
      label={text.label}
      title={headline}
      lead={lead}
      palette={palette}
      aside={
        clear ? (
          <AllClearArt className="hidden h-36 sm:block" />
        ) : (
          !none && (
            <BannerFigures
              figures={[
                { label: text.warnings, value: warnings },
                { label: text.advisories, value: advisories },
              ]}
            />
          )
        )
      }
    >
      {clear && checked.length > 0 && (
        <ul aria-label={text.locationsChecked} className="mt-6 flex flex-wrap gap-2">
          {checked.map((place) => (
            <li key={place.key}>
              <Link
                href={placeHref(place)}
                className="flex items-center gap-1.5 rounded-full bg-background py-1 pr-3 pl-1.5 text-sm font-medium ring-1 ring-border backdrop-blur transition-colors hover:bg-card"
              >
                <span
                  aria-hidden="true"
                  className="grid size-5 place-items-center rounded-full bg-card text-sky-accent"
                >
                  <IconCheck className="size-3" stroke={3} />
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
