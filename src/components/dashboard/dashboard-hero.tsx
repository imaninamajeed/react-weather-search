import { ArrowRight, CalendarDays, House, Radar } from "lucide-react";
import Link from "next/link";
import { IsobarMark } from "@/components/shared/isobar-mark";
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

// The glows and isobars are bright, so every line of info text carries a soft halo in the panel's own
// colour (--halo: white by day, black by night). It keeps the text readable wherever it
// crosses the art, without a visible box.
const halo = "[text-shadow:0_0_14px_var(--halo),0_0_5px_var(--halo)]";

const caption = `font-heading text-[0.6875rem] font-medium tracking-[0.08em] text-foreground/75 uppercase dark:text-white/90 ${halo}`;

/**
 * The dashboard's one focus: home, now. The place and what it is doing sit on the left, the
 * temperature on the right, and the next twelve hours run beneath. The mark's isobars are drawn
 * behind the temperature and fade out well before the words, so the art is the weather's own
 * pressure map and never a surface for text. Dark mode uses the mark's ink; light mode is white
 * with the same colours washed out.
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
    <header className="relative isolate overflow-hidden rounded-4xl bg-card text-card-foreground shadow-md ring-1 ring-foreground/5 [--glow-magenta:12%] [--glow-teal:7%] [--halo:oklch(1_0_0/0.95)] dark:bg-black dark:text-white dark:shadow-none dark:ring-0 dark:[--glow-magenta:30%] dark:[--glow-teal:10%] dark:[--halo:#000]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(55% 90% at 100% 0%, color-mix(in oklch, var(--brand-magenta) var(--glow-magenta), transparent), transparent 70%)",
            "radial-gradient(50% 80% at 0% 100%, color-mix(in oklch, var(--brand-teal) var(--glow-teal), transparent), transparent 70%)",
          ].join(", "),
        }}
      />
      <IsobarMark
        bare
        detail="full"
        className="pointer-events-none absolute -top-28 -right-24 -z-10 size-[30rem] mask-[radial-gradient(closest-side,black_35%,transparent)] opacity-40 motion-safe:animate-[spin_240s_linear_infinite] lg:-top-48 lg:-right-24 lg:size-[38rem] dark:opacity-55"
      />

      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Badge variant="secondary" className="dark:bg-white/10 dark:text-white">
              <House aria-hidden="true" />
              {t.dashboard.hero.home}
            </Badge>
            <p className={caption}>{localTimeLine}</p>
          </div>

          <h2
            id="place-title"
            className="mt-4 font-heading text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"
          >
            <Link
              href={href}
              className="underline decoration-transparent decoration-2 underline-offset-8 transition-colors hover:decoration-(--brand-teal-text)"
            >
              {place.name}
            </Link>
          </h2>
          <p className={`mt-2 text-foreground/80 dark:text-white/90 ${halo}`}>
            {formatPlaceSubtitle(place)}
          </p>
          <p className={`mt-5 max-w-prose text-lg text-balance ${halo}`}>
            {summarizeToday(forecast, units, locale)}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button asChild size="lg">
              <Link href={href}>
                {t.dashboard.hero.fullForecast}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
            >
              <Link href={`${href}/outlook`}>
                <CalendarDays aria-hidden="true" />
                {t.dashboard.hero.outlook}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
            >
              <Link
                href={`/map?place=${encodeURIComponent(place.key)}`}
                aria-label={t.dashboard.hero.radarFor(place.name)}
              >
                <Radar aria-hidden="true" />
                {t.dashboard.hero.radar}
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <WeatherIcon
            name={weather.icon}
            className="size-14 shrink-0 text-(--brand-teal-text) drop-shadow-[0_0_16px_color-mix(in_oklch,var(--brand-teal)_55%,transparent)] motion-safe:animate-[float_7s_ease-in-out_infinite] sm:size-20 lg:size-24"
          />
          <div>
            <p className="font-heading text-8xl leading-none font-medium tracking-tight sm:text-9xl dark:[text-shadow:0_0_36px_color-mix(in_oklch,var(--brand-magenta)_60%,transparent)]">
              <span className="sr-only">
                {units === "metric"
                  ? t.common.degreesCelsius(temperature)
                  : t.common.degreesFahrenheit(temperature)}
              </span>
              <span aria-hidden="true">
                {temperature}
                <span className="align-top text-3xl font-normal text-(--brand-teal-text) sm:text-5xl">
                  {units === "metric" ? "°C" : "°F"}
                </span>
              </span>
            </p>
            <p className={`mt-2 text-lg ${halo}`}>{weather.label}</p>
            <p className={`text-sm text-foreground/80 tabular-nums dark:text-white/90 ${halo}`}>
              {t.common.high} {formatTemperature(today.temperatureMax, units)} · {t.common.low}{" "}
              {formatTemperature(today.temperatureMin, units)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 pt-4 pb-5 dark:border-white/10">
        <HourStrip forecast={forecast} units={units} tone="glass" adaptive />
      </div>
    </header>
  );
}
