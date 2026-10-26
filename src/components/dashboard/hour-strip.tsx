import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatHour } from "@/lib/format";
import { formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Forecast, Units } from "@/lib/weather/types";

const HOURS = 12;

/** The next twelve hours as a horizontally scrolling strip. */
export function HourStrip({ forecast, units }: { forecast: Forecast; units: Units }) {
  return (
    <ol className="relative -mx-4 flex gap-1 overflow-x-auto px-4 pb-2" aria-label="Next 12 hours">
      {forecast.hourly.slice(0, HOURS).map((hour, index) => {
        const weather = describeWeather(hour.weatherCode, hour.isDay);
        return (
          <li
            key={hour.time}
            className="flex min-w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 px-2 py-3"
          >
            <span className="label-caps">{index === 0 ? "Now" : formatHour(hour.time)}</span>
            <WeatherIcon name={weather.icon} className="size-5" />
            <span className="sr-only">{weather.label}</span>
            <span className="text-base font-medium">
              {formatTemperature(hour.temperature, units)}
            </span>
            <span className="tnum text-xs text-muted-foreground">
              {hour.precipitationProbability >= 20 ? `${hour.precipitationProbability}%` : " "}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
