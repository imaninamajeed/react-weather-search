import { OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { loadAlerts } from "@/components/alerts/load-alerts";
import { PANEL } from "@/components/place/tile";
import { ShownCount } from "@/components/shared/shown-count";
import { SourceNote } from "@/components/alerts/source-note";
import { compareAlerts } from "@/lib/alerts/describe";
import { placeHref, type Place } from "@/lib/places";
import { cn } from "@/lib/utils";
import type { Units } from "@/lib/weather/types";
import { AlertTile } from "./alert-tile";

/** How many alerts the dashboard shows; the full list lives on /alerts. */
const SUMMARY_LIMIT = 3;

/**
 * The body of the dashboard's Alerts card. On the left, how much there is to know: the count, how it
 * splits by severity, and how much of it is official. On the right, the few most important alerts
 * across everywhere you follow, each naming its place. With none it says so, plainly, and still says
 * what was checked. Everything else is one click away on /alerts.
 */
export async function AlertsOverview({ places, units }: { places: Place[]; units: Units }) {
  const { entries, failed, sources } = await loadAlerts(places);

  const all = entries
    .flatMap(({ place, alerts, now }) => alerts.map((alert) => ({ alert, place, now })))
    .sort((a, b) => compareAlerts(a.alert, b.alert));
  const shown = all.slice(0, SUMMARY_LIMIT);

  const failedNote = failed > 0 && (
    <p className="mt-3 text-xs font-medium">
      Couldn&apos;t check {failed === 1 ? "one place" : `${failed} places`} just now.
    </p>
  );
  const sourceNote = sources.length > 0 && <SourceNote sources={sources} />;

  if (all.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-medium">All clear</p>
            <p className="text-sm text-muted-foreground">
              No active alerts across{" "}
              {places.length === 1 ? "your place" : `your ${places.length} places`}.
            </p>
          </div>
        </div>
        {failedNote}
        {sourceNote}
      </div>
    );
  }

  const warnings = all.filter(({ alert }) => alert.severity === "warning").length;
  const advisories = all.length - warnings;
  const official = all.filter(({ alert }) => alert.source !== "forecast").length;
  const affected = new Set(all.map(({ place }) => place.key)).size;

  const breakdown = [
    warnings > 0 && {
      label: warnings === 1 ? "Warning" : "Warnings",
      count: warnings,
      icon: <OctagonAlert aria-hidden="true" className="size-4 text-warning" />,
    },
    advisories > 0 && {
      label: advisories === 1 ? "Advisory" : "Advisories",
      count: advisories,
      icon: (
        <TriangleAlert
          aria-hidden="true"
          className="size-4 text-advisory-foreground dark:text-advisory"
        />
      ),
    },
  ].filter((row) => row !== false);

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[15rem_1fr] lg:gap-3">
        {/* The count: how much there is to know, on an inset surface of its own like the readings. */}
        <div className={cn(PANEL, "flex flex-col gap-4")}>
          <p className="label-caps">Active alerts</p>
          <div>
            <p className="tnum font-heading text-6xl leading-none font-medium">{all.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              in {affected} of {places.length} {places.length === 1 ? "place" : "places"}
            </p>
          </div>

          {/* How the alerts split by severity, as a bar and as words. */}
          <div
            role="img"
            aria-label={`${warnings} ${warnings === 1 ? "warning" : "warnings"}, ${advisories} ${advisories === 1 ? "advisory" : "advisories"}`}
            className="flex h-1.5 gap-0.5 overflow-hidden rounded-full"
          >
            {warnings > 0 && <span className="bg-warning" style={{ flexGrow: warnings }} />}
            {advisories > 0 && <span className="bg-advisory" style={{ flexGrow: advisories }} />}
          </div>
          <dl className="space-y-1.5 text-sm">
            {breakdown.map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                {row.icon}
                <dt className="flex-1">{row.label}</dt>
                <dd className="tnum font-medium">{row.count}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">
            {official === 0
              ? "All from our forecast signals"
              : `${official} official, ${all.length - official} from our forecast signals`}
          </p>
        </div>

        {/* The alerts themselves, one tile each. They grow to the count's height, so the two end on the
            same line as well as starting on it. */}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
          {shown.map(({ alert, place, now }) => (
            <AlertTile
              key={`${place.key}:${alert.id}`}
              alert={alert}
              units={units}
              now={now}
              place={{ name: place.name, href: placeHref(place) }}
            />
          ))}
        </ul>
      </div>
      {/* The footer: what was checked and anything that could not be, one note per line with its own
          icon, set off from the alerts by a rule; and, apart from them, how much of the list is shown. */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-t border-border pt-4">
        <ul className="min-w-0 space-y-2">
          {sources.length > 0 && (
            <li className="flex items-start gap-2 [&_p]:mt-0">
              {sources.some((source) => source.status === "unavailable") ? (
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-warning"
                />
              ) : (
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                />
              )}
              <SourceNote sources={sources} />
            </li>
          )}
          {failed > 0 && (
            <li className="flex items-start gap-2 text-xs font-medium">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <span>
                Couldn&apos;t check {failed === 1 ? "one place" : `${failed} places`} just now.
              </span>
            </li>
          )}
        </ul>
        <ShownCount shown={shown.length} total={all.length} />
      </div>
    </div>
  );
}
