import type { ReactNode } from "react";
import { sceneFor, SkyPanel } from "@/components/shared/sky-panel";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { HourStrip } from "@/components/dashboard/hour-strip";
import { formatPlaceSubtitle, formatUtcOffset, formatWeekdayClock } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Place } from "@/lib/places";
import { cn } from "@/lib/utils";
import {
  compassPoint,
  convertTemperature,
  formatPrecipitation,
  formatSpeed,
  formatTemperature,
} from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import { summarizeToday } from "@/lib/weather/summary";
import type { Forecast, Units } from "@/lib/weather/types";

interface PlaceHeroProps {
  place: Place;
  forecast: Forecast;
  units: Units;
  /** Badges and buttons, top right. */
  actions?: ReactNode;
  /** The dashboard owns the page's h1, so its hero heading is an h2. */
  headingLevel?: 1 | 2;
  /** Show the day's four numbers beneath (feels like, high / low, rain, wind); on screens that fit a page to the viewport, also stand tall in a side column. */
  fit?: boolean;
  className?: string;
}

/**
 * The opening panel of a place's forecast, painted with the sky over the place right now (see
 * SkyPanel): its gradient, drifting clouds, rain or stars behind, and the condition's illustrated
 * icon beside the temperature. Text sits straight on the sky in the sky's own ink.
 */
export async function PlaceHero({
  place,
  forecast,
  units,
  actions,
  headingLevel = 1,
  fit = false,
  className,
}: PlaceHeroProps) {
  const { locale, t } = await getI18n();
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const { current } = forecast;
  const today = forecast.daily[0];
  const weather = describeWeather(current.weatherCode, current.isDay, locale);
  const temperature = Math.round(convertTemperature(current.temperature, units));
  const localTimeLine = t.dashboard.hero.localTime(
    formatWeekdayClock(current.time, locale),
    formatUtcOffset(forecast.utcOffsetSeconds),
  );

  return (
    <SkyPanel
      as="header"
      scene={sceneFor(forecast)}
      className={cn(fit && "fit:flex fit:flex-col", className)}
    >
      <div
        className={cn(
          "grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end",
          fit && "fit:flex fit:flex-col fit:gap-3 fit:p-4 fit:pb-3",
        )}
      >
        <div>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <p className="label-caps">{localTimeLine}</p>
            {actions}
          </div>
          <Heading
            id="place-title"
            className={cn(
              "mt-3 font-heading text-5xl leading-[0.95] md:text-7xl",
              fit && "fit:text-5xl",
            )}
          >
            {place.name}
          </Heading>
          <p className="mt-2 text-muted-foreground">{formatPlaceSubtitle(place)}</p>
          <p
            className={cn(
              "mt-6 max-w-prose text-lg text-balance",
              fit && "fit:mt-2 fit:line-clamp-2 fit:text-base",
            )}
          >
            {summarizeToday(forecast, units, locale)}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <WeatherIcon
            name={weather.icon}
            animated
            className="size-20 drop-shadow-lg md:size-28 fit:size-20"
          />
          <div>
            <p
              className={cn(
                "font-heading text-7xl leading-none font-medium tracking-tight md:text-9xl",
                fit && "fit:text-6xl",
              )}
            >
              <span className="sr-only">
                {units === "metric"
                  ? t.common.degreesCelsius(temperature)
                  : t.common.degreesFahrenheit(temperature)}
              </span>
              <span aria-hidden="true">
                {temperature}
                <span className="align-top text-3xl font-normal text-muted-foreground md:text-5xl">
                  {units === "metric" ? "°C" : "°F"}
                </span>
              </span>
            </p>
            <p className="mt-1 text-lg">{weather.label}</p>
          </div>
        </div>
      </div>

      {fit && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border bg-background px-6 py-4 md:px-10 fit:gap-y-2 fit:px-6">
          <Stat
            label={t.place.hero.feelsLike}
            value={formatTemperature(current.apparentTemperature, units)}
          />
          <Stat
            label={t.place.hero.highLow}
            value={`${formatTemperature(today.temperatureMax, units)} / ${formatTemperature(today.temperatureMin, units)}`}
          />
          <Stat
            label={t.place.hero.rainToday}
            value={`${today.precipitationProbabilityMax}%`}
            detail={formatPrecipitation(today.precipitationSum, units)}
          />
          <Stat
            label={t.place.hero.wind}
            value={formatSpeed(current.windSpeed, units)}
            detail={t.place.hero.from(compassPoint(current.windDirection, locale))}
          />
        </dl>
      )}

      <div className={cn("border-t border-border px-6 pt-4 pb-5 md:px-10", fit && "fit:hidden")}>
        <HourStrip forecast={forecast} units={units} tone="glass" />
      </div>
    </SkyPanel>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 text-xl font-medium">
        {value}
        {detail && (
          <span className="block text-sm font-normal text-muted-foreground xl:ml-2 xl:inline">
            {detail}
          </span>
        )}
      </dd>
    </div>
  );
}
