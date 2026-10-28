import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatHour } from "@/lib/format";
import { formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Forecast, Units } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

const HOURS = 12;

/**
 * The next twelve hours as a horizontally scrolling strip. `glass` is for sitting on the dark hero:
 * translucent tiles, light text, and a teal chance-of-rain.
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
                    "border-white/10 bg-white/5 text-white backdrop-blur-sm",
                    now && "border-(--brand-teal)/50 bg-white/10",
                  )
                : "border-border/60 bg-card/50",
            )}
          >
            <span
              className={cn(
                "font-mono text-[0.6875rem] font-medium tracking-[0.08em] uppercase",
                glass ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {now ? "Now" : formatHour(hour.time)}
            </span>
            <WeatherIcon name={weather.icon} className={cn("size-5", glass && "text-white/90")} />
            <span className="sr-only">{weather.label}</span>
            <span className="text-base font-medium">
              {formatTemperature(hour.temperature, units)}
            </span>
            <span
              className={cn(
                "tnum text-xs",
                glass ? "text-(--brand-teal)" : "text-muted-foreground",
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
