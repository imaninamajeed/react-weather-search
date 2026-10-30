import { ArrowRight, House, Radar } from "lucide-react";
import Link from "next/link";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPlaceSubtitle, formatUtcOffset, formatWeekdayClock } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";
import { convertTemperature, formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import { summarizeToday } from "@/lib/weather/summary";
import type { Forecast, Units } from "@/lib/weather/types";
import { HourStrip } from "./hour-strip";

const caption =
  "font-heading text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase dark:text-white/75";

/**
 * The dashboard's one focus: home, now. The place and what it is doing sit on the left, the
 * temperature on the right, and the next twelve hours run beneath. The mark's isobars are drawn
 * behind the temperature and fade out well before the words, so the art is the weather's own
 * pressure map and never a surface for text. Dark mode uses the mark's ink; light mode is white
 * with the same colours washed out.
 */
export function DashboardHero({
  place,
  forecast,
  units,
}: {
  place: Place;
  forecast: Forecast;
  units: Units;
}) {
  const { current } = forecast;
  const today = forecast.daily[0];
  const weather = describeWeather(current.weatherCode, current.isDay);
  const temperature = Math.round(convertTemperature(current.temperature, units));
  const localTimeLine = `${formatWeekdayClock(current.time)} · local time (${formatUtcOffset(forecast.utcOffsetSeconds)})`;
  const href = placeHref(place);

  return (
    <header className="relative isolate overflow-hidden rounded-4xl bg-card text-card-foreground shadow-md ring-1 ring-foreground/5 [--glow-magenta:10%] [--glow-teal:10%] dark:bg-(--brand-ink) dark:text-white dark:ring-white/10 dark:[--glow-magenta:26%] dark:[--glow-teal:16%]">
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
        className="pointer-events-none absolute -top-28 -right-24 -z-10 size-[30rem] mask-[radial-gradient(closest-side,black_35%,transparent)] opacity-50 motion-safe:animate-[spin_240s_linear_infinite] lg:-top-36 lg:-right-16 lg:size-[38rem]"
      />

      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Badge variant="secondary" className="dark:bg-white/10 dark:text-white">
              <House aria-hidden="true" />
              Home
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
          <p className="mt-2 text-muted-foreground dark:text-white/80">
            {formatPlaceSubtitle(place)}
          </p>
          <p className="mt-5 max-w-prose text-lg text-balance">{summarizeToday(forecast, units)}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button asChild size="lg">
              <Link href={href}>
                Full Forecast
                <ArrowRight aria-hidden="true" />
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
                aria-label={`Radar for ${place.name}`}
              >
                <Radar aria-hidden="true" />
                Radar
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <WeatherIcon
            name={weather.icon}
            className="size-14 shrink-0 text-(--brand-teal-text) motion-safe:animate-[float_7s_ease-in-out_infinite] sm:size-20 lg:size-24"
          />
          <div>
            <p className="font-heading text-8xl leading-none font-medium tracking-tight sm:text-9xl">
              <span className="sr-only">
                {temperature} degrees {units === "metric" ? "Celsius" : "Fahrenheit"}
              </span>
              <span aria-hidden="true">
                {temperature}
                <span className="align-top text-3xl font-normal text-(--brand-teal-text) sm:text-5xl">
                  {units === "metric" ? "°C" : "°F"}
                </span>
              </span>
            </p>
            <p className="mt-2 text-lg">{weather.label}</p>
            <p className="text-sm text-muted-foreground tabular-nums dark:text-white/75">
              H {formatTemperature(today.temperatureMax, units)} · L{" "}
              {formatTemperature(today.temperatureMin, units)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 pt-4 pb-5 md:px-10 dark:border-white/10">
        <HourStrip forecast={forecast} units={units} tone="glass" adaptive />
      </div>
    </header>
  );
}
