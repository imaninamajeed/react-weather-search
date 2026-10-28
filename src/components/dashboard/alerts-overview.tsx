import { IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";
import { AlertItem } from "@/components/alerts/alert-item";
import { loadAlerts } from "@/components/alerts/load-alerts";
import { SourceNote } from "@/components/alerts/source-note";
import { compareAlerts } from "@/lib/alerts/describe";
import { placeHref, type Place } from "@/lib/places";
import type { Units } from "@/lib/weather/types";

/** How many alerts the dashboard shows; the full list lives on /alerts. */
const SUMMARY_LIMIT = 3;

/**
 * The dashboard's alert summary: the few most important alerts across everywhere you follow, with the
 * place named on each. Everything else is one click away on the alerts page.
 */
export async function AlertsOverview({ places, units }: { places: Place[]; units: Units }) {
  const { entries, failed, sources } = await loadAlerts(places);

  const all = entries
    .flatMap(({ place, alerts, now }) => alerts.map((alert) => ({ alert, place, now })))
    .sort((a, b) => compareAlerts(a.alert, b.alert));
  const shown = all.slice(0, SUMMARY_LIMIT);

  return (
    <div>
      {all.length === 0 ? (
        <p className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--brand-teal)_20%,transparent)] text-chart-4"
          >
            <IconShieldCheck className="size-5" />
          </span>
          No active alerts across your {places.length === 1 ? "place" : `${places.length} places`}.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {shown.map(({ alert, place, now }) => (
              <AlertItem
                key={`${place.key}:${alert.id}`}
                alert={alert}
                units={units}
                now={now}
                place={{ name: place.name, href: placeHref(place) }}
              />
            ))}
          </ul>
          {all.length > shown.length && (
            <p className="mt-3 text-sm">
              <Link
                href="/alerts"
                className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                View all {all.length} alerts
              </Link>
            </p>
          )}
        </>
      )}
      {failed > 0 && (
        <p className="mt-3 text-xs font-medium">
          Couldn&apos;t check {failed === 1 ? "one place" : `${failed} places`} just now.
        </p>
      )}
      {sources.length > 0 && <SourceNote sources={sources} />}
    </div>
  );
}
