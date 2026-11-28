import { IconArrowRight, IconCalendarWeek, IconHome, IconRadar } from "@tabler/icons-react";
import Link from "next/link";
import { sceneFor, SkyPanel } from "@/components/shared/sky-panel";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPlaceSubtitle, formatUtcOffset, formatWeekdayClock } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { placeHref, type Place } from "@/lib/places";
import { convertTemperature, formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import { summarizeToday } from "@/lib/weather/summary";
import type { Forecast, Units } from "@/lib/weather/types";
import { HourStrip } from "./hour-strip";

/**
 * The dashboard's one focus: home, now, painted with the sky over it (sunny, golden, starry, wet,
 * stormy…). The place and what it is doing sit on the left, the temperature and its illustrated
 * condition on the right, and the next twelve hours run beneath. On a phone they stack as place,
 * summary, temperature, then the links onward: the weather comes before the navigation. Text sits
 * straight on the sky, whose ink is chosen for contrast (see SkyPanel).
 */
export async function DashboardHero({
  place,
  forecast,
  units,
}: {
  place: Place;
  forecast: Forecast;
  units: Units;
}) {
  const { locale, t } = await getI18n();
  const { current } = forecast;
  const today = forecast.daily[0];
  const weather = describeWeather(current.weatherCode, current.isDay, locale);
  const temperature = Math.round(convertTemperature(current.temperature, units));
  const localTimeLine = t.dashboard.hero.localTime(
    formatWeekdayClock(current.time, locale),
    formatUtcOffset(forecast.utcOffsetSeconds),
  );
  const href = placeHref(place);

  return (
    <SkyPanel as="header" scene={sceneFor(forecast)}>
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-x-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Badge variant="secondary">
              <IconHome aria-hidden="true" />
              {t.dashboard.hero.home}
            </Badge>
            <p className="label-caps">{localTimeLine}</p>
          </div>

          <h2
            id="place-title"
            className="mt-4 font-heading text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"
          >
            <Link
              href={href}
              className="underline decoration-transparent decoration-2 underline-offset-8 transition-colors hover:decoration-current"
            >
              {place.name}
            </Link>
          </h2>
          <p className="mt-2 text-muted-foreground">{formatPlaceSubtitle(place)}</p>
          <p className="mt-5 max-w-prose text-lg text-balance">
            {summarizeToday(forecast, units, locale)}
          </p>
        </div>

        {/* Before the buttons in the source, so a phone shows the temperature without scrolling. */}
        <div className="flex items-center gap-4 sm:gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <WeatherIcon
            name={weather.icon}
            animated
            className="size-20 drop-shadow-lg sm:size-24 lg:size-32"
          />
          <div>
            <p className="font-heading text-8xl leading-none font-medium tracking-tight sm:text-9xl">
              <span className="sr-only">
                {units === "metric"
                  ? t.common.degreesCelsius(temperature)
                  : t.common.degreesFahrenheit(temperature)}
              </span>
              <span aria-hidden="true">
                {temperature}
                <span className="align-top text-3xl font-normal text-muted-foreground sm:text-5xl">
                  {units === "metric" ? "°C" : "°F"}
                </span>
              </span>
            </p>
            <p className="mt-2 text-lg">{weather.label}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {t.common.high} {formatTemperature(today.temperatureMax, units)} · {t.common.low}{" "}
              {formatTemperature(today.temperatureMin, units)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:col-start-1 lg:row-start-2">
          <Button asChild size="lg">
            <Link href={href}>
              {t.dashboard.hero.fullForecast}
              <IconArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`${href}/outlook`}>
              <IconCalendarWeek aria-hidden="true" />
              {t.dashboard.hero.outlook}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link
              href={`/map?place=${encodeURIComponent(place.key)}`}
              aria-label={t.dashboard.hero.radarFor(place.name)}
            >
              <IconRadar aria-hidden="true" />
              {t.dashboard.hero.radar}
            </Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-6 pt-4 pb-5">
        <HourStrip forecast={forecast} units={units} tone="glass" adaptive />
      </div>
    </SkyPanel>
  );
}
