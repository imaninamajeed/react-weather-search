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
import { HazardBadge } from "@/components/alerts/hazard-badge";
import { loadAlerts } from "@/components/alerts/load-alerts";
import { SourceNote } from "@/components/alerts/source-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPlaceSubtitle } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";
import type { Units } from "@/lib/weather/types";
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
    <div className="flex flex-col gap-4">
      <div className="rise" style={rise(0)}>
        <AlertsSummary
          warnings={warnings}
          advisories={totalAll - warnings}
          affected={entries.filter((entry) => entry.alerts.length > 0).length}
          places={places.length}
          byPlace={entries.map(({ place, alerts }) => {
            const shown = officialOnly ? official(alerts) : alerts;
            const shownWarnings = shown.filter((a) => a.severity === "warning").length;
            return {
              key: place.key,
              name: place.name,
              warnings: shownWarnings,
              advisories: shown.length - shownWarnings,
            };
          })}
          totalAll={totalAll}
          totalOfficial={totalOfficial}
          officialOnly={officialOnly}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          {groups.length === 0
            ? // With no alerts at all the summary already says "All clear"; only a filter needs a word here.
              officialOnly && (
                <div
                  className="rise flex flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl border border-border px-4 py-3"
                  style={rise(1)}
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
            : groups.map(({ place, alerts, now }, index) => (
                <section
                  key={place.key}
                  aria-labelledby={`alerts-${place.key}`}
                  className="rise"
                  style={rise(index + 1)}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
                    <h2
                      id={`alerts-${place.key}`}
                      className="font-heading text-2xl leading-tight sm:text-3xl"
                    >
                      <Link
                        href={placeHref(place)}
                        className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-(--brand-teal-text)"
                      >
                        {place.name}
                      </Link>
                    </h2>
                    {place.key === homeKey && (
                      <Badge variant="secondary">
                        <House aria-hidden="true" />
                        Home
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground">{formatPlaceSubtitle(place)}</p>
                    <div className="ml-auto">
                      <HazardBadge alerts={alerts} />
                    </div>
                  </div>
                  <AlertList alerts={alerts} units={units} now={now} limit={10} />
                </section>
              ))}
        </div>

        <aside
          aria-label="About These Alerts"
          className="rise xl:sticky xl:top-4"
          style={rise(groups.length + 1)}
        >
          <Card size="sm" className="bg-transparent shadow-none ring-border">
            <CardHeader>
              <CardTitle role="heading" aria-level={2} className="text-lg">
                Reading Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="space-y-3">
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

              {failed > 0 && (
                <p className="flex items-start gap-2 font-medium">
                  <TriangleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-warning"
                  />
                  Couldn&apos;t check {failed === 1 ? "one place" : `${failed} places`} just now.
                </p>
              )}
              {sources.length > 0 && (
                <div className="[&_p]:mt-0">
                  <SourceNote sources={sources} />
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
