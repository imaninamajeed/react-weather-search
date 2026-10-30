import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { PlaceAlerts } from "@/components/alerts/place-alerts";
import { SectionCard } from "@/components/shared/section-card";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { RowsSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/stat-cards";
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
    <div className="grid gap-4 fit:min-h-0 fit:flex-1 fit:grid-cols-12 fit:gap-3">
      <div className="contents fit:col-span-4 fit:flex fit:min-h-0 fit:flex-col fit:gap-3">
        <PlaceHero
          place={resolved}
          forecast={forecast}
          units={units}
          actions={actions}
          fit
          className="fit:flex-none"
        />

        <div className="fit:hidden">
          <StatCards forecast={forecast} units={units} />
        </div>

        <SectionCard
          id="alerts"
          title="Alerts"
          description={`Warnings and signals for ${resolved.name}`}
          className="fit:min-h-0 fit:flex-1"
        >
          <SectionBoundary title="Alerts">
            <Suspense fallback={<RowsSkeleton rows={1} />}>
              <PlaceAlerts place={resolved} forecast={forecast} units={units} />
            </Suspense>
          </SectionBoundary>
        </SectionCard>
      </div>

      <div className="contents fit:col-span-8 fit:flex fit:min-h-0 fit:flex-col fit:gap-3">
        <SectionCard
          id="conditions"
          title="Right now"
          description="The sun, the wind and the air at this moment"
          bodyClassName="fit:overflow-visible"
        >
          <ConditionsGrid forecast={forecast} units={units} />
        </SectionCard>

        <div className="contents fit:grid fit:min-h-0 fit:flex-1 fit:grid-cols-8 fit:gap-3">
          <SectionCard
            id="hourly"
            title="Next 48 hours"
            description="Switch between temperature, rain and wind"
            className="fit:col-span-5"
            bodyClassName="fit:flex fit:flex-col fit:gap-2 fit:space-y-0"
          >
            <HourlyChart hours={hours} units={units} />
            <HourlyTable hours={hours} units={units} />
          </SectionCard>

          <SectionCard
            id="next-days"
            title="Next 3 days"
            description="Each bar spans the day's low to high on one shared scale"
            className="fit:col-span-3"
            aside={
              <Button asChild variant="outline" size="sm">
                <Link href={`${placeHref(resolved)}/outlook`}>
                  <span className="fit:sr-only">14-day outlook and confidence</span>
                  <span aria-hidden="true" className="hidden fit:inline">
                    Outlook
                  </span>
                  <IconArrowRight aria-hidden="true" />
                </Link>
              </Button>
            }
          >
            <DailyList forecast={forecast} units={units} limit={3} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
