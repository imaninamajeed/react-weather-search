import { Droplets } from "lucide-react";
import Link from "next/link";
import { HazardBadge } from "@/components/alerts/hazard-badge";
import { PANEL } from "@/components/place/tile";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { highestSeverity } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import { formatPlaceSubtitle, formatTime } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";
import { formatTemperature } from "@/lib/units";
import { cn } from "@/lib/utils";
import { describeWeather } from "@/lib/weather/codes";
import { describeRainOutlook } from "@/lib/weather/summary";
import type { Forecast, Units } from "@/lib/weather/types";
import { Sparkline } from "./sparkline";

/**
 * One followed place on the dashboard, on the same inset surface as the forecast page's readings.
 * Built to answer "which of my places needs attention?" at a glance: an alert is a badge beside the
 * name and a tinted edge on the tile; the place's own local time sits beside the name too, since
 * that is the first thing to compare across time zones; and the rain line says what to do ("Rain
 * from 3 PM", "Dry for the next 24 h"), not the day's peak chance. The name, subtitle and link come
 * from what is saved on this device, so they render even when the forecast could not be fetched.
 * The whole tile is one link.
 */
export function LocationTile({
  place,
  units,
  forecast,
  alerts,
}: {
  place: Place;
  units: Units;
  /** Null when the forecast could not be fetched: the tile still links to the place. */
  forecast: Forecast | null;
  alerts: WeatherAlert[];
}) {
  const severity = highestSeverity(alerts);

  return (
    <article
      className={cn(
        PANEL,
        "relative flex h-full flex-col transition-colors focus-within:ring-2 focus-within:ring-ring/50 hover:bg-muted",
        // The edge carries the alert's colour; the badge beside the name carries it in words.
        severity === "warning" && "ring-2 ring-warning/50 dark:ring-warning/60",
        severity === "advisory" && "ring-2 ring-advisory/70 dark:ring-advisory/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <h3 className="min-w-0 truncate font-heading text-xl">
          {/* Stretched link: the whole tile is the target. */}
          <Link href={placeHref(place)} className="outline-none after:absolute after:inset-0">
            {place.name}
          </Link>
        </h3>
        {forecast && (
          <span className="tnum text-sm text-muted-foreground">
            · {formatTime(forecast.current.time)}
          </span>
        )}
        <HazardBadge alerts={alerts} />
      </div>
      <p className="mb-3 truncate text-sm text-muted-foreground">{formatPlaceSubtitle(place)}</p>

      {forecast ? <TileWeather forecast={forecast} units={units} /> : <Unavailable />}
    </article>
  );
}

function Unavailable() {
  return <p className="text-sm text-muted-foreground">Conditions are unavailable right now.</p>;
}

function TileWeather({ forecast, units }: { forecast: Forecast; units: Units }) {
  const { current, daily, hourly } = forecast;
  const today = daily[0];
  const weather = describeWeather(current.weatherCode, current.isDay);
  const next24 = hourly.slice(0, 24).map((hour) => hour.temperature);
  const low = formatTemperature(Math.min(...next24), units);
  const high = formatTemperature(Math.max(...next24), units);

  return (
    <>
      {/* Now: the number and what it looks like. */}
      <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
        <p className="font-heading text-5xl leading-none font-medium tracking-tight tabular-nums">
          {formatTemperature(current.temperature, units)}
        </p>
        <p className="flex items-center gap-1.5 text-right text-sm">
          <WeatherIcon name={weather.icon} className="size-5 shrink-0 text-muted-foreground" />
          {weather.label}
        </p>
      </div>

      {/* Next: the shape of the day, with its range written out beneath. */}
      <div className="my-4">
        <Sparkline values={next24} label={`${low} to ${high} over the next 24 hours`} />
        <div className="tnum mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Next 24 h</span>
          <span>
            {low} – {high}
          </span>
        </div>
      </div>

      {/* Then: two facts side by side, each with its own label, split by a rule. */}
      <dl className="mt-auto grid grid-cols-2 divide-x divide-border border-t border-border pt-3 text-sm">
        <div className="min-w-0 pr-3">
          <dt className="label-caps">High / Low</dt>
          <dd className="tnum mt-1 font-medium">
            {formatTemperature(today.temperatureMax, units)} /{" "}
            {formatTemperature(today.temperatureMin, units)}
          </dd>
        </div>
        <div className="min-w-0 pl-3">
          <dt className="label-caps">Rain</dt>
          <dd className="mt-1 flex items-center gap-1.5 font-medium">
            <Droplets aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">{describeRainOutlook(hourly)}</span>
          </dd>
        </div>
      </dl>
    </>
  );
}
