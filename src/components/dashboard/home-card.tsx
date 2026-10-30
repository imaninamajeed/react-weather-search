import { IconCloudRain, IconDroplet, IconTemperature, IconWind } from "@tabler/icons-react";
import { ArrowRight, House } from "lucide-react";
import Link from "next/link";
import { HazardBadge } from "@/components/alerts/hazard-badge";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPlaceSubtitle, formatUtcOffset, formatWeekdayClock } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { placeHref, type Place } from "@/lib/places";
import { compassPoint, convertTemperature, formatSpeed, formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import { summarizeToday } from "@/lib/weather/summary";
import type { Units } from "@/lib/weather/types";
import { HourlyCurve } from "./hourly-curve";
import { loadPlace } from "./load-place";
import { RowMenu } from "./place-row-controls";
import { WeekStrip } from "./week-strip";

/**
 * The home location, the focus of the page: full width, with the large temperature, the day in a
 * sentence and the week beneath, on the dashboard's Saved Locations tile surface (the page background, lifted by a shadow; near-black by night). The isobars and glows
 * belong to the page banner above it, so this card stays calm; the saved locations are plain
 * squares by comparison. The name, link and menu come from the saved snapshot, so they render even
 * when the forecast could not be fetched. `manage` is absent when home is only the default city
 * and not saved, so there is nothing to remove.
 */
export async function HomeCard({
  place,
  units,
  manage,
}: {
  place: Place;
  units: Units;
  manage?: { isFirst: boolean; isLast: boolean };
}) {
  const [{ forecast, alerts }, { locale, t }] = await Promise.all([loadPlace(place), getI18n()]);
  const href = placeHref(place);
  const current = forecast?.current;
  const today = forecast?.daily[0];
  const weather = current && describeWeather(current.weatherCode, current.isDay, locale);
  const degrees = current && Math.round(convertTemperature(current.temperature, units));

  return (
    <article className="group/row relative flex min-h-[30rem] flex-col overflow-hidden rounded-4xl bg-card text-card-foreground shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div className="grid flex-1 gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Badge variant="secondary">
              <House aria-hidden="true" />
              {t.dashboard.hero.home}
            </Badge>
            {current && forecast && (
              <p className="label-caps">
                {t.dashboard.hero.localTime(
                  formatWeekdayClock(current.time, locale),
                  formatUtcOffset(forecast.utcOffsetSeconds),
                )}
              </p>
            )}
            <HazardBadge alerts={alerts} />
          </div>
          <h3 className="mt-5 font-heading text-5xl leading-[0.95] sm:text-6xl">
            <Link
              href={href}
              className="underline decoration-transparent decoration-2 underline-offset-8 transition-colors hover:decoration-(--brand-teal-text)"
            >
              {place.name}
            </Link>
          </h3>
          <p className="mt-2 text-muted-foreground">{formatPlaceSubtitle(place)}</p>
          {forecast ? (
            <p className="mt-4 max-w-prose text-balance">
              {summarizeToday(forecast, units, locale)}
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t.common.unavailable(place.name)}. {t.common.providerDidntRespond}
            </p>
          )}
          <Button asChild size="lg" className="mt-5">
            <Link href={href}>
              {t.dashboard.hero.fullForecast}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {current && today && weather && (
          <div className="flex items-center gap-4 sm:gap-6">
            <span
              aria-hidden="true"
              className="grid size-24 shrink-0 place-items-center rounded-full bg-(--brand-teal-text)/10 sm:size-32"
            >
              <WeatherIcon
                name={weather.icon}
                className="size-12 text-(--brand-teal-text) sm:size-16"
              />
            </span>
            <div>
              <p className="font-heading text-7xl leading-none font-medium tracking-tight sm:text-8xl">
                <span className="sr-only">
                  {units === "metric"
                    ? t.common.degreesCelsius(degrees!)
                    : t.common.degreesFahrenheit(degrees!)}
                </span>
                <span aria-hidden="true">
                  {degrees}
                  <span className="align-top text-2xl font-normal text-(--brand-teal-text) sm:text-4xl">
                    {units === "metric" ? "°C" : "°F"}
                  </span>
                </span>
              </p>
              <p className="mt-2 text-lg">{weather.label}</p>
              <p className="tnum text-sm text-muted-foreground">
                {t.common.high} {formatTemperature(today.temperatureMax, units)} · {t.common.low}{" "}
                {formatTemperature(today.temperatureMin, units)}
              </p>
            </div>
          </div>
        )}
      </div>

      {forecast && (
        <div className="mx-6 border-t border-border py-5 sm:mx-8">
          <HourlyCurve forecast={forecast} units={units} />
        </div>
      )}

      {current && today && (
        <dl className="mx-6 grid grid-cols-2 gap-y-4 border-t border-border py-5 sm:mx-8 sm:grid-cols-4 sm:divide-x sm:divide-border">
          {[
            {
              Icon: IconTemperature,
              label: t.dashboard.stats.feelsLike,
              value: formatTemperature(current.apparentTemperature, units),
            },
            {
              Icon: IconWind,
              label: t.dashboard.stats.wind,
              value: `${formatSpeed(current.windSpeed, units)} ${compassPoint(current.windDirection, locale)}`,
            },
            {
              Icon: IconDroplet,
              label: t.dashboard.week.humidity,
              value: `${Math.round(current.humidity)}%`,
            },
            {
              Icon: IconCloudRain,
              label: t.dashboard.stats.chanceOfRain,
              value: `${today.precipitationProbabilityMax}%`,
            },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 sm:px-5 sm:first:pl-0">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-(--brand-teal-text)/10 text-(--brand-teal-text)"
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <dt className="label-caps">{label}</dt>
                <dd className="tnum mt-1 font-heading text-2xl leading-none font-medium">
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      )}

      {forecast && (
        <div className="border-t border-border px-6 pt-6 pb-7 sm:px-8">
          <WeekStrip forecast={forecast} alerts={alerts} units={units} />
        </div>
      )}

      {manage && (
        <div className="absolute top-4 right-4 z-10">
          <RowMenu
            placeKey={place.key}
            placeName={place.name}
            isHome
            isFirst={manage.isFirst}
            isLast={manage.isLast}
          />
        </div>
      )}
    </article>
  );
}
