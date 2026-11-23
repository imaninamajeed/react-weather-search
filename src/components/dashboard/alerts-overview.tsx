import { ArrowRight, OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { loadAlerts } from "@/components/alerts/load-alerts";
import { SourceNote } from "@/components/alerts/source-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { compareAlerts, describeAlert } from "@/lib/alerts/describe";
import { alertsSignature } from "@/lib/alerts/dismissed";
import { getI18n } from "@/lib/i18n/server";
import { placeHref, type Place } from "@/lib/places";
import { cn } from "@/lib/utils";
import type { Units } from "@/lib/weather/types";
import { AlertsInfo } from "./alerts-info";
import { DismissibleAlerts } from "./dismissible-alerts";

/** How many alerts the dashboard shows; the full list lives on /alerts. */
const SUMMARY_LIMIT = 2;

/**
 * The dashboard's Alerts, sized to what there is to say, and the same height either way so the page does
 * not jump when they arrive. With none it is a calm single line with no link, as there is nothing to go and read. With some it is a banner tinted by the
 * most serious one: how many of each kind, the two most important as chips (each a link to its place,
 * serious ones first) and a "+N more", and the way to the rest. It has a close button that remembers
 * what you have seen (see lib/alerts/dismissed). What was checked, and anything that
 * could not be, is behind a small info button (a warning icon when a check failed). The full notices, the
 * detail and the per-place grouping all live on /alerts.
 */
export async function AlertsOverview({
  places,
  units,
  dismissed,
}: {
  places: Place[];
  units: Units;
  /** The signature of the alerts last dismissed (from the cookie), if any. */
  dismissed?: string;
}) {
  const [{ entries, failed, sources }, { locale, t }] = await Promise.all([
    loadAlerts(places),
    getI18n(),
  ]);
  const text = t.dashboard.overview;

  const all = entries
    .flatMap(({ place, alerts, now }) => alerts.map((alert) => ({ alert, place, now })))
    .sort((a, b) => compareAlerts(a.alert, b.alert));
  const shown = all.slice(0, SUMMARY_LIMIT);
  const signature = alertsSignature(all.map(({ alert, place }) => `${place.key}:${alert.id}`));
  const placesLabel = places.length === 1 ? text.yourLocation : text.yourLocations(places.length);

  const allAlerts = (
    <Button asChild variant="outline" size="sm" className="shrink-0">
      <Link href="/alerts">
        {text.allAlerts}
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
  const failedNote = failed > 0 && (
    <p className="flex items-center gap-1.5 font-medium">
      <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0 text-warning" />
      {text.couldntCheck(failed)}
    </p>
  );
  const sourceNote = sources.length > 0 && (
    <div className="[&_p]:mt-0">
      <SourceNote sources={sources} />
    </div>
  );
  // Whether the all-clear (or the list) can be trusted: a feed that was down is not an all-clear.
  const checkFailed = failed > 0 || sources.some((source) => source.status === "unavailable");
  const info = (sourceNote || failedNote) && (
    <AlertsInfo warn={checkFailed}>
      {sourceNote}
      {failedNote}
    </AlertsInfo>
  );

  if (all.length === 0) {
    return (
      <section
        aria-labelledby="alerts-title"
        className="flex min-h-13 flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl border border-border px-4 py-2"
      >
        <h2 id="alerts-title" className="sr-only">
          {t.dashboard.alerts}
        </h2>
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--brand-teal-text)_14%,transparent)] text-(--brand-teal-text)"
        >
          <ShieldCheck className="size-4" />
        </span>
        <p className="text-sm">
          <span className="font-medium">{text.allClear}</span>{" "}
          <span className="text-muted-foreground">{text.noActive(placesLabel)}</span>
        </p>
        {info && <div className="ml-auto flex items-center gap-1">{info}</div>}
      </section>
    );
  }

  // Closed by you, and nothing has changed since: leave it out.
  if (dismissed === signature) return null;

  const warnings = all.filter(({ alert }) => alert.severity === "warning").length;
  const advisories = all.length - warnings;
  const hasWarning = warnings > 0;
  const SeverityIcon = hasWarning ? OctagonAlert : TriangleAlert;
  // "1 warning and 2 advisories": what the most serious thing is comes first.
  const headline = [
    warnings > 0 && t.common.warnings(warnings),
    advisories > 0 && t.common.advisories(advisories),
  ]
    .filter(Boolean)
    .join(text.and);

  return (
    <section aria-labelledby="alerts-title">
      <h2 id="alerts-title" className="sr-only">
        {t.dashboard.alerts}
      </h2>
      <DismissibleAlerts signature={signature}>
        {/* Tinted by the most serious alert, so it is read before the forecast it sits above. */}
        <Card
          size="sm"
          className={cn(
            "min-h-13 justify-center gap-0 py-0",
            hasWarning
              ? "bg-warning/10 shadow-[0_0_40px_-16px_var(--warning)] ring-warning/40"
              : "bg-advisory/15 ring-advisory/50",
          )}
        >
          <CardContent className="grid items-center gap-x-4 gap-y-2 py-2 pr-12 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
            {/* How serious, and how many. */}
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "relative grid size-8 shrink-0 place-items-center rounded-full",
                  hasWarning
                    ? "bg-warning text-warning-foreground"
                    : "bg-advisory text-advisory-foreground",
                )}
              >
                {hasWarning && (
                  <span className="absolute inset-0 rounded-full bg-warning/50 motion-safe:animate-ping" />
                )}
                <SeverityIcon className="relative size-4" />
              </span>
              <p className="min-w-0">
                <span className="sr-only">{text.activeAlerts}</span>
                <span className="font-heading text-lg leading-tight font-medium">{headline}</span>
              </p>
            </div>

            {/* What and where: each a link to its place. When it ends is in the tooltip. */}
            <ul className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
              {shown.map(({ alert, place, now }) => {
                const description = describeAlert(alert, units, now, locale);
                const isWarning = alert.severity === "warning";
                const Icon = isWarning ? OctagonAlert : TriangleAlert;
                return (
                  <li key={`${place.key}:${alert.id}`} className="min-w-0">
                    <Link
                      href={placeHref(place)}
                      title={description.when}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-background/70 py-1 pr-3 pl-2 text-sm transition-colors hover:bg-background dark:bg-background/40 dark:hover:bg-background/60"
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-3.5 shrink-0",
                          isWarning
                            ? "text-warning"
                            : "text-advisory-foreground dark:text-advisory",
                        )}
                      />
                      <span className="sr-only">
                        {isWarning ? t.common.warning : t.common.advisory}:{" "}
                      </span>
                      <span className="truncate font-medium">{description.title}</span>
                      <Separator
                        orientation="vertical"
                        className="h-3.5 data-vertical:self-center"
                      />
                      <span className="truncate text-muted-foreground">{place.name}</span>
                      <span className="sr-only">, {description.when}</span>
                    </Link>
                  </li>
                );
              })}
              {all.length > shown.length && (
                <li className="text-sm whitespace-nowrap text-muted-foreground">
                  {t.common.more(all.length - shown.length)}
                </li>
              )}
            </ul>

            {/* The way to the rest; what was checked only when a check failed. */}
            <div className="flex items-center gap-1 lg:justify-end">
              {checkFailed && info}
              {allAlerts}
            </div>
          </CardContent>
        </Card>
      </DismissibleAlerts>
    </section>
  );
}
