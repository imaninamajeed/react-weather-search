import { IconDroplets } from "@tabler/icons-react";
import { Fragment } from "react";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatDayMonth, formatWeekday } from "@/lib/format";
import { temperatureColor, temperatureGradient } from "@/lib/temperature-color";
import { formatPrecipitation, formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { ConfidenceLevel } from "@/lib/weather/confidence";
import type { Forecast, Units } from "@/lib/weather/types";
import { cn } from "@/lib/utils";
import { CONFIDENCE_LABEL, ConfidenceDots } from "./confidence-dots";

/** Beyond this many days the models drift apart too much for day-level detail to be firm. */
const FIRM_DAYS = 7;

/**
 * 14 days on one shared temperature scale, so bars are comparable down the whole list.
 * The gradient inside each bar uses the same absolute colour ramp as the rest of the app.
 */
export function DailyList({
  forecast,
  units,
  limit,
  confidence,
}: {
  forecast: Forecast;
  units: Units;
  /** Show only the first N days (the scale still spans all of them, so bars stay comparable). */
  limit?: number;
  /** Model agreement per date; adds a confidence column for the days the models cover. */
  confidence?: Record<string, ConfidenceLevel | null>;
}) {
  const { daily, current } = forecast;
  const scaleMin = Math.floor(Math.min(...daily.map((d) => d.temperatureMin)) - 1);
  const scaleMax = Math.ceil(Math.max(...daily.map((d) => d.temperatureMax)) + 1);
  const span = scaleMax - scaleMin;
  const position = (celsius: number) => ((celsius - scaleMin) / span) * 100;

  return (
    <div className="@container/daily">
      <ol className="divide-y divide-border/70">
        {daily.slice(0, limit).map((day, index) => {
          const weather = describeWeather(day.weatherCode);
          const left = position(day.temperatureMin);
          const width = Math.max(position(day.temperatureMax) - left, 2);
          return (
            <Fragment key={day.date}>
              {index === FIRM_DAYS && (
                <li className="label-caps py-3 text-center">
                  Days {FIRM_DAYS + 1}–{daily.length}: indicative only, see forecast confidence
                  below
                </li>
              )}
              <li
                className={cn(
                  "grid items-center gap-x-3 py-2.5",
                  confidence
                    ? "grid-cols-[3.5rem_1.75rem_3.25rem_1fr_2.5rem] @lg/daily:grid-cols-[5.5rem_11rem_4.5rem_1fr_6.5rem]"
                    : "grid-cols-[3.5rem_1.75rem_3.25rem_1fr] @max-[17rem]/daily:grid-cols-[2.75rem_1.25rem_1fr] @lg/daily:grid-cols-[5.5rem_11rem_4.5rem_1fr]",
                )}
              >
                <div>
                  <p className="text-sm font-medium">
                    {index === 0 ? "Today" : formatWeekday(day.date)}
                  </p>
                  <p className="label-caps hidden @lg/daily:block">{formatDayMonth(day.date)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <WeatherIcon name={weather.icon} className="size-5" />
                  <span className="hidden text-sm @lg/daily:inline">{weather.label}</span>
                  <span className="sr-only @lg/daily:hidden">{weather.label}</span>
                </div>

                <p
                  className="flex items-center gap-1 text-sm text-muted-foreground @max-[17rem]/daily:hidden"
                  title={formatPrecipitation(day.precipitationSum, units)}
                >
                  <IconDroplets aria-hidden="true" className="size-3.5" />
                  <span className="tnum">{day.precipitationProbabilityMax}%</span>
                  <span className="sr-only">chance of rain</span>
                </p>

                <div className="flex items-center gap-3">
                  <span className="tnum w-9 text-right text-sm text-muted-foreground">
                    {formatTemperature(day.temperatureMin, units)}
                  </span>
                  <div aria-hidden="true" className="relative h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 rounded-full"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundImage: temperatureGradient(
                          day.temperatureMin,
                          day.temperatureMax,
                        ),
                      }}
                    />
                    {index === 0 && (
                      <span
                        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
                        style={{
                          left: `${position(current.temperature)}%`,
                          backgroundColor: temperatureColor(current.temperature),
                        }}
                      />
                    )}
                  </div>
                  <span className="tnum w-9 text-sm font-medium">
                    {formatTemperature(day.temperatureMax, units)}
                  </span>
                </div>

                {confidence && (
                  <p className="flex items-center justify-end gap-2 text-sm">
                    {confidence[day.date] ? (
                      <>
                        <ConfidenceDots level={confidence[day.date]} />
                        <span className="hidden @lg/daily:inline">
                          {CONFIDENCE_LABEL[confidence[day.date]!]}
                        </span>
                        <span className="sr-only">
                          {CONFIDENCE_LABEL[confidence[day.date]!]} confidence
                        </span>
                      </>
                    ) : (
                      <span aria-hidden="true" className="text-muted-foreground">
                        –
                      </span>
                    )}
                  </p>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
