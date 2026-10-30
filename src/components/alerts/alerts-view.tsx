import Link from "next/link";
import { AlertList } from "@/components/alerts/alert-list";
import { loadAlerts } from "@/components/alerts/load-alerts";
import { SourceNote } from "@/components/alerts/source-note";
import { placeHref, type Place } from "@/lib/places";
import type { Units } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

const chip =
  "rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent";

/** Every alert for every place you follow, grouped by place, with a filter for official warnings only. */
export async function AlertsView({
  places,
  units,
  officialOnly,
}: {
  places: Place[];
  units: Units;
  officialOnly: boolean;
}) {
  const { entries, failed, sources } = await loadAlerts(places);

  const official = (alerts: { source: string }[]) => alerts.filter((a) => a.source !== "forecast");
  const totalAll = entries.reduce((sum, e) => sum + e.alerts.length, 0);
  const totalOfficial = entries.reduce((sum, e) => sum + official(e.alerts).length, 0);

  const groups = entries
    .map((entry) => ({
      ...entry,
      alerts: officialOnly ? entry.alerts.filter((a) => a.source !== "forecast") : entry.alerts,
    }))
    .filter((entry) => entry.alerts.length > 0);

  return (
    <div className="space-y-6 fit:flex fit:min-h-0 fit:flex-1 fit:flex-col fit:gap-3 fit:space-y-0">
      <nav aria-label="Filter alerts" className="flex flex-wrap gap-2">
        <Link
          href="/alerts"
          aria-current={officialOnly ? undefined : "page"}
          className={cn(chip, !officialOnly && "bg-accent font-medium")}
        >
          All alerts ({totalAll})
        </Link>
        <Link
          href="/alerts?show=official"
          aria-current={officialOnly ? "page" : undefined}
          className={cn(chip, officialOnly && "bg-accent font-medium")}
        >
          Official warnings ({totalOfficial})
        </Link>
      </nav>

      {groups.length === 0 ? (
        <p>
          {officialOnly
            ? "No official warnings right now. Forecast signals are listed under All alerts."
            : `No active alerts across your ${places.length === 1 ? "place" : `${places.length} places`}.`}
        </p>
      ) : (
        <div className="space-y-8 fit:grid fit:min-h-0 fit:flex-1 fit:grid-cols-[repeat(auto-fit,minmax(24rem,1fr))] fit:content-start fit:gap-3 fit:space-y-0 fit:overflow-y-auto">
          {groups.map(({ place, alerts, now }) => (
            <section
              key={place.key}
              aria-labelledby={`alerts-${place.key}`}
              className="fit:min-w-0 fit:self-start fit:rounded-4xl fit:bg-card fit:p-5 fit:shadow-md fit:ring-1 fit:ring-foreground/5"
            >
              <h2 id={`alerts-${place.key}`} className="mb-3 font-heading text-2xl fit:text-xl">
                <Link
                  href={placeHref(place)}
                  className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  {place.name}
                </Link>
              </h2>
              <AlertList alerts={alerts} units={units} now={now} limit={10} />
            </section>
          ))}
        </div>
      )}

      {failed > 0 && (
        <p className="text-xs font-medium">
          Couldn&apos;t check {failed === 1 ? "one place" : `${failed} places`} just now.
        </p>
      )}
      {sources.length > 0 && <SourceNote sources={sources} />}
    </div>
  );
}
