import { Clock, Droplets, OctagonAlert, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { describeAlert, highestSeverity, sortAlerts } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import { formatPlaceSubtitle, formatTime } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";
import { convertTemperature, formatTemperature } from "@/lib/units";
import type { Locale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import { describeWeather } from "@/lib/weather/codes";
import { describeRainOutlook } from "@/lib/weather/summary";
import type { Forecast, Units } from "@/lib/weather/types";
import { getI18n } from "@/lib/i18n/server";
import { Sparkline } from "./sparkline";

const caption = "label-caps dark:text-white/75";

/**
 * One followed place on the dashboard, in the hero's typography (the teal weather icon and the large
 * temperature with its teal unit) on a crisp inset surface: white by day, and by night near-black (the page's own background), a step lighter than the hero's true black. The hero keeps the deep ink panel, the
 * glows and the mark's isobars to itself, so the one place that is home stands out from the places
 * you follow and the tiles never compete with it. Built to answer "which of my places
 * needs attention?" at a glance: an alert is a solid band across the top of the tile that names the
 * most serious one, in words and an icon as well as colour; the place's own local time sits above
 * the name, since that is the first thing to compare across time zones;
 * and the rain line says what to do ("Rain from 3 PM", "Dry for the next 24 h"), not the day's peak
 * chance. The name, subtitle and link come from what is saved on this device, so they render even
 * when the forecast could not be fetched. The whole tile is one link.
 */
export async function LocationTile({
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
  const { locale, t } = await getI18n();
  const severity = highestSeverity(alerts);
  const [top, ...rest] = sortAlerts(alerts);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-3xl bg-background shadow-md transition-[box-shadow,background-color] focus-within:ring-2 focus-within:ring-ring/50 hover:shadow-lg dark:bg-background dark:hover:bg-[color-mix(in_oklch,var(--background),white_5%)]",
      )}
    >
      {severity && top && forecast && (
        <AlertBand
          severity={severity}
          title={describeAlert(top, units, forecast.current.time, locale).title}
          more={rest.length}
          t={t}
        />
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {forecast && (
            <p className={cn(caption, "tnum flex items-center gap-1.5")}>
              <Clock aria-hidden="true" className="size-3.5" />
              {formatTime(forecast.current.time, locale)}
            </p>
          )}
        </div>
        <h3 className="mt-2 min-w-0 truncate font-heading text-3xl leading-tight">
          {/* Stretched link: the whole tile is the target. */}
          <Link href={placeHref(place)} className="outline-none after:absolute after:inset-0">
            {place.name}
          </Link>
        </h3>
        <p className="truncate text-sm text-muted-foreground dark:text-white/80">
          {formatPlaceSubtitle(place)}
        </p>

        {forecast ? (
          <TileWeather forecast={forecast} units={units} locale={locale} t={t} />
        ) : (
          <Unavailable t={t} />
        )}
      </div>
    </article>
  );
}

/**
 * The alert, across the top of the tile, named: a quiet tint with a coloured icon, so it marks the
 * tile without competing with the banner at the top of the page, which is the loudest alert there is.
 * The icon's shape (octagon for a warning, triangle for an advisory) and the words carry it for anyone
 * who cannot rely on the colour.
 */
function AlertBand({
  severity,
  title,
  more,
  t,
}: {
  severity: "warning" | "advisory";
  title: string;
  /** How many further alerts there are for this place. */
  more: number;
  t: Messages;
}) {
  const isWarning = severity === "warning";
  const Icon = isWarning ? OctagonAlert : TriangleAlert;
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 border-b px-5 py-3 text-xs font-medium sm:px-6",
        isWarning ? "border-warning/20 bg-warning/8" : "border-advisory/30 bg-advisory/12",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0",
          isWarning ? "text-warning" : "text-advisory-foreground dark:text-advisory",
        )}
      />
      <span className="sr-only">{isWarning ? t.common.warning : t.common.advisory}: </span>
      <span className="min-w-0 truncate">{title}</span>
      {more > 0 && (
        <span className="ml-auto shrink-0 whitespace-nowrap text-foreground/80">
          {t.common.more(more)}
        </span>
      )}
    </div>
  );
}

function Unavailable({ t }: { t: Messages }) {
  return (
    <p className="mt-5 text-sm text-muted-foreground dark:text-white/80">
      {t.dashboard.tile.unavailable}
    </p>
  );
}

function TileWeather({
  forecast,
  units,
  locale,
  t,
}: {
  forecast: Forecast;
  units: Units;
  locale: Locale;
  t: Messages;
}) {
  const { current, daily, hourly } = forecast;
  const today = daily[0];
  const weather = describeWeather(current.weatherCode, current.isDay, locale);
  const temperature = Math.round(convertTemperature(current.temperature, units));
  const next24 = hourly.slice(0, 24).map((hour) => hour.temperature);
  const low = formatTemperature(Math.min(...next24), units);
  const high = formatTemperature(Math.max(...next24), units);

  return (
    <>
      {/* Now: what it looks like and today's range, beside the number. */}
      <div className="mt-6 mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg">{weather.label}</p>
          <p className="tnum flex gap-3 text-sm text-muted-foreground dark:text-white/75">
            <span>
              {t.common.high} {formatTemperature(today.temperatureMax, units)}
            </span>
            <span>
              {t.common.low} {formatTemperature(today.temperatureMin, units)}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <WeatherIcon name={weather.icon} className="size-9 shrink-0 text-(--brand-teal-text)" />
          <p className="font-heading text-6xl leading-none font-medium tracking-tight">
            <span className="sr-only">
              {units === "metric"
                ? t.common.degreesCelsius(temperature)
                : t.common.degreesFahrenheit(temperature)}
            </span>
            <span aria-hidden="true">
              {temperature}
              <span className="align-top text-xl font-normal text-(--brand-teal-text)">
                {units === "metric" ? "°C" : "°F"}
              </span>
            </span>
          </p>
        </div>
      </div>

      {/* Next: the shape of the next day, and what to do about rain. */}
      <div className="mt-auto grid gap-4 border-t border-border pt-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-6 dark:border-white/10">
        <div className="mt-5 sm:mt-0">
          <Sparkline values={next24} label={t.dashboard.tile.overNext24(low, high)} />
          <div className="tnum mt-1.5 flex items-center justify-between text-xs text-muted-foreground dark:text-white/75">
            <span>{t.dashboard.tile.next24}</span>
            <span>
              {low} – {high}
            </span>
          </div>
        </div>
        <div className="min-w-0 sm:border-l sm:border-border sm:pl-6 sm:dark:border-white/10">
          <p className={caption}>{t.dashboard.tile.rain}</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium">
            <Droplets aria-hidden="true" className="size-4 shrink-0 text-(--brand-teal-text)" />
            <span className="min-w-0">{describeRainOutlook(hourly, locale)}</span>
          </p>
        </div>
      </div>
    </>
  );
}
