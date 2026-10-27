import type { ReactNode } from "react";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatPlaceSubtitle, formatUtcOffset, formatWeekdayClock } from "@/lib/format";
import type { Place } from "@/lib/places";
import {
  compassPoint,
  convertTemperature,
  formatPrecipitation,
  formatSpeed,
  formatTemperature,
} from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import { skyTint } from "@/lib/weather/sky";
import { summarizeToday } from "@/lib/weather/summary";
import type { Forecast, Units } from "@/lib/weather/types";

interface PlaceHeroProps {
  place: Place;
  forecast: Forecast;
  units: Units;
  /** Save / set-home controls, top right. */
  actions?: ReactNode;
  /** The dashboard owns the page's h1, so its hero heading is an h2. */
  headingLevel?: 1 | 2;
}

export function PlaceHero({ place, forecast, units, actions, headingLevel = 1 }: PlaceHeroProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const { current } = forecast;
  const today = forecast.daily[0];
  const weather = describeWeather(current.weatherCode, current.isDay);
  const tint = skyTint(current.weatherCode, current.isDay);
  const temperature = Math.round(convertTemperature(current.temperature, units));
  const localTimeLine = `${formatWeekdayClock(current.time)} · local time (${formatUtcOffset(forecast.utcOffsetSeconds)})`;

  return (
    <header
      className="overflow-hidden rounded-xl border border-border"
      style={{
        backgroundImage: `linear-gradient(135deg, color-mix(in oklch, ${tint} 24%, var(--card)) 0%, var(--card) 65%)`,
      }}
    >
      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <p className="label-caps">{localTimeLine}</p>
            {actions}
          </div>
          <Heading
            id="place-title"
            className="mt-3 font-heading text-5xl leading-[0.95] md:text-7xl"
          >
            {place.name}
          </Heading>
          <p className="mt-2 text-muted-foreground">{formatPlaceSubtitle(place)}</p>
          <p className="mt-6 max-w-prose text-lg text-balance">{summarizeToday(forecast, units)}</p>
        </div>

        <div className="flex items-center gap-5">
          <WeatherIcon name={weather.icon} className="size-16 text-foreground/80 md:size-20" />
          <div>
            <p className="text-7xl leading-none font-medium tracking-tight md:text-8xl">
              <span className="sr-only">
                {temperature} degrees {units === "metric" ? "Celsius" : "Fahrenheit"}
              </span>
              <span aria-hidden="true">
                {temperature}
                <span className="align-top text-3xl font-normal text-muted-foreground md:text-4xl">
                  {units === "metric" ? "°C" : "°F"}
                </span>
              </span>
            </p>
            <p className="mt-1 text-lg">{weather.label}</p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/70 px-6 py-4 md:grid-cols-4 md:px-10">
        <Stat label="Feels like" value={formatTemperature(current.apparentTemperature, units)} />
        <Stat
          label="High / Low"
          value={`${formatTemperature(today.temperatureMax, units)} / ${formatTemperature(today.temperatureMin, units)}`}
        />
        <Stat
          label="Rain today"
          value={`${today.precipitationProbabilityMax}%`}
          detail={formatPrecipitation(today.precipitationSum, units)}
        />
        <Stat
          label="Wind"
          value={formatSpeed(current.windSpeed, units)}
          detail={`from ${compassPoint(current.windDirection)}`}
        />
      </dl>
    </header>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 text-xl font-medium">
        {value}
        {detail && <span className="ml-2 text-sm font-normal text-muted-foreground">{detail}</span>}
      </dd>
    </div>
  );
}
