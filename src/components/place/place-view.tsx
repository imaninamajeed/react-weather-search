import { Section } from "@/components/shared/section";
import { getForecast } from "@/lib/open-meteo/forecast";
import type { Place } from "@/lib/places";
import type { Units } from "@/lib/weather/types";
import { ConditionsGrid } from "./conditions-grid";
import { DailyList } from "./daily-list";
import { PlaceHero } from "./hero";
import { HourlyChart } from "./hourly-chart";
import { HourlyTable } from "./hourly-table";

const CHART_HOURS = 48;

/** Everything about one place. A forecast outage fails the whole view (it's the page's core). */
export async function PlaceView({ place, units }: { place: Place; units: Units }) {
  const forecast = await getForecast(place.latitude, place.longitude);
  const hours = forecast.hourly.slice(0, CHART_HOURS);
  // Dropped-pin places learn their timezone from the forecast.
  const resolved: Place = { ...place, timezone: place.timezone ?? forecast.timezone };

  return (
    <div className="space-y-10">
      <PlaceHero place={resolved} forecast={forecast} units={units} />

      <Section id="hourly" title="Next 48 hours">
        <HourlyChart hours={hours} units={units} />
        <HourlyTable hours={hours} units={units} />
      </Section>

      <Section id="daily" title="14-day outlook">
        <DailyList forecast={forecast} units={units} />
      </Section>

      <Section id="conditions" title="Right now">
        <ConditionsGrid forecast={forecast} units={units} />
      </Section>
    </div>
  );
}
