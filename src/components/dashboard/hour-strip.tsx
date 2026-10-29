import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatHour } from "@/lib/format";
import { formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Forecast, Units } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

const HOURS = 12;

/**
 * The next twelve hours as a horizontally scrolling strip. `glass` is for sitting on the hero:
 * translucent tiles and a teal chance-of-rain, in either theme.
 */
export function HourStrip({
  forecast,
  units,
  tone = "default",
}: {
  forecast: Forecast;
  units: Units;
  tone?: "default" | "glass";
}) {
  const glass = tone === "glass";
  return (
    <ol
      className="relative -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:-mx-10 md:px-10"
      aria-label="Next 12 hours"
    >
      {forecast.hourly.slice(0, HOURS).map((hour, index) => {
        const weather = describeWeather(hour.weatherCode, hour.isDay);
        const now = index === 0;
        return (
          <li
            key={hour.time}
            className={cn(
              "flex min-w-16 shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3",
              glass
                ? cn(
                    "border-border bg-background/60 backdrop-blur-sm dark:border-white/10 dark:bg-white/5",
                    now &&
                      "border-(--brand-teal-text)/50 bg-background dark:border-(--brand-teal)/50 dark:bg-white/10",
                  )
                : "border-border/60 bg-card/50",
            )}
          >
            <span
              className={cn(
                "font-mono text-[0.6875rem] font-medium tracking-[0.08em] uppercase",
                "text-muted-foreground",
                glass && "dark:text-white/80",
              )}
            >
              {now ? "Now" : formatHour(hour.time)}
            </span>
            <WeatherIcon name={weather.icon} className="size-5" />
            <span className="sr-only">{weather.label}</span>
            <span className="text-base font-medium">
              {formatTemperature(hour.temperature, units)}
            </span>
            <span
              className={cn(
                "tnum text-xs",
                glass ? "text-(--brand-teal-text)" : "text-muted-foreground",
              )}
            >
              {hour.precipitationProbability >= 20 ? `${hour.precipitationProbability}%` : " "}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
