import {
  ArrowRight,
  ChartLine,
  ChevronDown,
  House,
  OctagonAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AlertList } from "@/components/alerts/alert-list";
import { loadAlerts } from "@/components/alerts/load-alerts";
import { SourceNote } from "@/components/alerts/source-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { compareBySeverity } from "@/lib/alerts/describe";
import { formatPlaceSubtitle } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";
import { cn } from "@/lib/utils";
import type { Units } from "@/lib/weather/types";
import { AlertsFilter } from "./alerts-filter";
import { AlertsSummary } from "./alerts-summary";

/** Staggers a section's arrival, as on the dashboard; position only, and not at all with reduced motion. */
const rise = (index: number) => ({ "--i": index }) as CSSProperties;

function LegendRow({
  icon,
  term,
  children,
}: {
  icon: ReactNode;
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {icon}
      </span>
      <div>
        <dt className="font-medium">{term}</dt>
        <dd className="text-muted-foreground">{children}</dd>
      </div>
    </div>
  );
}

/**
 * Every alert for every place you follow, grouped by place, with a filter for official warnings only.
 * The alerts are one calm column; what the labels mean and what was checked sit beside them on wide
 * screens (and after them on narrow ones), so the column itself carries nothing but the alerts.
 */
export async function AlertsView({
  places,
  homeKey,
  units,
  officialOnly,
}: {
  places: Place[];
  homeKey: string;
  units: Units;
  officialOnly: boolean;
}) {
  const { entries, failed, sources } = await loadAlerts(places);

  const official = <T extends { source: string }>(alerts: T[]) =>
    alerts.filter((a) => a.source !== "forecast");
  const everyAlert = entries.flatMap((entry) => entry.alerts);
  const totalAll = everyAlert.length;
  const totalOfficial = official(everyAlert).length;
  const warnings = everyAlert.filter((a) => a.severity === "warning").length;

  // Most serious first: within a place, and between places (most warnings, then most alerts). The sort
  // is stable, so places that tie stay in the order you follow them, home first.
  const warningCount = (alerts: { severity: string }[]) =>
    alerts.filter((a) => a.severity === "warning").length;
  const groups = entries
    .map((entry) => ({
      ...entry,
      alerts: (officialOnly ? official(entry.alerts) : entry.alerts).toSorted(compareBySeverity),
    }))
    .filter((entry) => entry.alerts.length > 0)
    .toSorted(
      (a, b) =>
        warningCount(b.alerts) - warningCount(a.alerts) || b.alerts.length - a.alerts.length,
    );

  return (
    <div className="flex flex-col gap-4 fit:gap-3">
      <div className="rise" style={rise(0)}>
        <AlertsSummary
          warnings={warnings}
          advisories={totalAll - warnings}
          affected={entries.filter((entry) => entry.alerts.length > 0).length}
          places={places.length}
          failed={failed}
          incomplete={failed > 0 || sources.some((source) => source.status === "unavailable")}
          checked={entries.map((entry) => entry.place)}
        />
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-4">
        {/* With no alerts there is nothing to filter, so the control would only offer two zeros. */}
        {totalAll > 0 && (
          <div className="rise" style={rise(1)}>
            <AlertsFilter
              totalAll={totalAll}
              totalOfficial={totalOfficial}
              officialOnly={officialOnly}
            />
          </div>
        )}

        {groups.length === 0 ? (
          // With no alerts at all the banner already says so; only a filter needs a word here.
          totalAll > 0 &&
          officialOnly && (
            <div
              className="rise flex flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl border border-border px-4 py-3"
              style={rise(2)}
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--brand-teal-text)_14%,transparent)] text-(--brand-teal-text)"
              >
                <ShieldCheck className="size-4" />
              </span>
              <p className="text-sm">
                <span className="font-medium">No official warnings right now.</span>{" "}
                <span className="text-muted-foreground">
                  Forecast signals are listed under All alerts.
                </span>
              </p>
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <Link href="/alerts">
                  All Alerts
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )
        ) : (
          // Cards flow into balanced columns and pack under one another, so places with one alert and
          // places with ten sit together without gaps; one place stays one wide column.
          <div
            className={cn(
              "gap-4",
              groups.length > 1 && "md:columns-2",
              groups.length > 2 && "2xl:columns-3",
            )}
          >
            {groups.map(({ place, alerts, now }, index) => (
              <section
                key={place.key}
                aria-labelledby={`alerts-${place.key}`}
                className="rise mb-4 break-inside-avoid"
                style={rise(index + 2)}
              >
                <Card>
                  <CardHeader className="gap-1">
                    <CardTitle
                      id={`alerts-${place.key}`}
                      role="heading"
                      aria-level={2}
                      className="text-2xl leading-tight"
                    >
                      <Link
                        href={placeHref(place)}
                        className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-(--brand-teal-text)"
                      >
                        {place.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      {place.key === homeKey && <House aria-hidden="true" className="size-3.5" />}
                      {[
                        place.key === homeKey && "Home",
                        formatPlaceSubtitle(place),
                        `${alerts.length} ${alerts.length === 1 ? "alert" : "alerts"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertList alerts={alerts} units={units} now={now} limit={10} />
                  </CardContent>
                </Card>
              </section>
            ))}
          </div>
        )}
      </div>

      <aside
        aria-label="About These Alerts"
        className="rise flex flex-col gap-3 text-sm"
        style={rise(groups.length + 2)}
      >
        {/* Folded away: the legend is for the first visit, not for every one. */}
        <details className="group rounded-3xl border border-border px-4 py-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            Reading Alerts
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          <dl className="mt-4 mb-2 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <LegendRow
              term="Warning"
              icon={
                <span className="grid size-6 place-items-center rounded-full bg-warning text-warning-foreground">
                  <OctagonAlert className="size-3.5" />
                </span>
              }
            >
              Serious or damaging conditions.
            </LegendRow>
            <LegendRow
              term="Advisory"
              icon={
                <span className="grid size-6 place-items-center rounded-full bg-advisory text-advisory-foreground">
                  <TriangleAlert className="size-3.5" />
                </span>
              }
            >
              Worth planning around.
            </LegendRow>
            <LegendRow
              term="Official"
              icon={<ShieldCheck className="size-6 p-1 text-(--brand-teal-text)" />}
            >
              Issued by a national weather service.
            </LegendRow>
            <LegendRow
              term="Forecast Signal"
              icon={<ChartLine className="size-6 p-1 text-muted-foreground" />}
            >
              Our own check of the forecast against set thresholds.
            </LegendRow>
          </dl>
        </details>

        {(failed > 0 || sources.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1">
            {failed > 0 && (
              <p className="flex items-center gap-2 font-medium">
                <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning" />
                Couldn&apos;t check {failed === 1 ? "one place" : `${failed} places`} just now.
              </p>
            )}
            {sources.length > 0 && (
              <div className="[&_p]:mt-0">
                <SourceNote sources={sources} />
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
