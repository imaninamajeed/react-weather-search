import {
  ArrowRight,
  ChartLine,
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
import { Separator } from "@/components/ui/separator";
import { formatPlaceSubtitle } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";
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

  const groups = entries
    .map((entry) => ({
      ...entry,
      alerts: officialOnly ? official(entry.alerts) : entry.alerts,
    }))
    .filter((entry) => entry.alerts.length > 0);

  return (
    <div className="flex flex-col gap-4 fit:gap-3">
      <div className="rise" style={rise(0)}>
        <AlertsSummary
          warnings={warnings}
          advisories={totalAll - warnings}
          affected={entries.filter((entry) => entry.alerts.length > 0).length}
          places={places.length}
        />
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-4">
        <div className="rise" style={rise(1)}>
          <AlertsFilter
            totalAll={totalAll}
            totalOfficial={totalOfficial}
            officialOnly={officialOnly}
          />
        </div>

        {groups.length === 0 ? (
          // With no alerts at all the summary already says "All clear"; only a filter needs a word here.
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
              {totalAll > 0 && (
                <Button asChild variant="outline" size="sm" className="ml-auto">
                  <Link href="/alerts">
                    All Alerts
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </div>
          )
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))] items-start gap-4">
            {groups.map(({ place, alerts, now }, index) => (
              <section
                key={place.key}
                aria-labelledby={`alerts-${place.key}`}
                className="rise"
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

      <aside aria-label="About These Alerts" className="rise" style={rise(groups.length + 2)}>
        <Card size="sm" className="bg-transparent shadow-none ring-border">
          <CardHeader>
            <CardTitle role="heading" aria-level={2} className="text-lg">
              Reading Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
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

            {(failed > 0 || sources.length > 0) && <Separator />}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
