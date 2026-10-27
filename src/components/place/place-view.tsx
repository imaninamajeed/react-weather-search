import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { PlaceAlerts } from "@/components/alerts/place-alerts";
import { Section } from "@/components/shared/section";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { RowsSkeleton } from "@/components/shared/skeletons";
import { getForecast } from "@/lib/open-meteo/forecast";
import { placeHref, type Place } from "@/lib/places";
import type { Units } from "@/lib/weather/types";
import { ConditionsGrid } from "./conditions-grid";
import { DailyList } from "./daily-list";
import { PlaceHero } from "./hero";
import { HourlyChart } from "./hourly-chart";
import { HourlyTable } from "./hourly-table";

const CHART_HOURS = 48;

/** Everything about one place. A forecast outage fails the whole view (it's the page's core). */
export async function PlaceView({
  place,
  units,
  actions,
}: {
  place: Place;
  units: Units;
  actions?: ReactNode;
}) {
  const forecast = await getForecast(place.latitude, place.longitude);
  const hours = forecast.hourly.slice(0, CHART_HOURS);
  // Dropped-pin places learn their timezone from the forecast.
  const resolved: Place = { ...place, timezone: place.timezone ?? forecast.timezone };

  return (
    <div className="space-y-10">
      <PlaceHero place={resolved} forecast={forecast} units={units} actions={actions} />

      <Section id="alerts" title="Alerts">
        <SectionBoundary title="Alerts">
          <Suspense fallback={<RowsSkeleton rows={1} />}>
            <PlaceAlerts place={resolved} forecast={forecast} units={units} />
          </Suspense>
        </SectionBoundary>
      </Section>

      <Section id="conditions" title="Right now">
        <ConditionsGrid forecast={forecast} units={units} />
      </Section>

      <Section id="hourly" title="Next 48 hours">
        <HourlyChart hours={hours} units={units} />
        <HourlyTable hours={hours} units={units} />
      </Section>

      <Section
        id="next-days"
        title="Next 3 days"
        aside={
          <Link
            href={`${placeHref(resolved)}/outlook`}
            className="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            14-day outlook and confidence →
          </Link>
        }
      >
        <DailyList forecast={forecast} units={units} limit={3} />
      </Section>
    </div>
  );
}
