import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPlaceSubtitle, formatUtcOffset, formatWeekdayClock } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";
import { convertTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import { summarizeToday } from "@/lib/weather/summary";
import type { Forecast, Units } from "@/lib/weather/types";
import { HourStrip } from "./hour-strip";

const caption =
  "font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase dark:text-white/75";

/**
 * The dashboard's opening panel: the home place lit by the app mark's magenta and teal, with the
 * isobars of its logo drawn large in the top-right corner. Dark mode uses the mark's own ink; light mode
 * is a white panel with the same colours washed out. The art is faded out well before the text, which
 * always sits on a plain, low-chroma surface.
 */
export function HomeHero({
  place,
  forecast,
  units,
}: {
  place: Place;
  forecast: Forecast;
  units: Units;
}) {
  const { current } = forecast;
  const weather = describeWeather(current.weatherCode, current.isDay);
  const temperature = Math.round(convertTemperature(current.temperature, units));
  const localTimeLine = `${formatWeekdayClock(current.time)} · local time (${formatUtcOffset(forecast.utcOffsetSeconds)})`;

  return (
    <header className="relative isolate overflow-hidden rounded-4xl bg-card text-card-foreground shadow-md ring-1 ring-foreground/5 [--glow-magenta:10%] [--glow-teal:10%] dark:bg-(--brand-ink) dark:text-white dark:ring-white/10 dark:[--glow-magenta:30%] dark:[--glow-teal:18%]">
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
        className="pointer-events-none absolute -top-32 -right-28 -z-10 size-[36rem] mask-[radial-gradient(closest-side,black_40%,transparent)] opacity-60 motion-safe:animate-[spin_240s_linear_infinite]"
      />

      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <p className={caption}>{localTimeLine}</p>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary" className="dark:bg-white/10 dark:text-white">
                Home
              </Badge>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
              >
                <Link href={placeHref(place)}>
                  Full forecast
                  <IconArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <h2 id="place-title" className="mt-3 font-heading text-5xl leading-[0.95] md:text-7xl">
            {place.name}
          </h2>
          <p className="mt-2 text-muted-foreground dark:text-white/80">
            {formatPlaceSubtitle(place)}
          </p>
          <p className="mt-6 max-w-prose text-lg text-balance">{summarizeToday(forecast, units)}</p>
        </div>

        <div className="flex items-center gap-5">
          <WeatherIcon
            name={weather.icon}
            className="size-16 text-(--brand-teal-text) md:size-24 dark:drop-shadow-[0_0_18px_var(--brand-teal)]"
          />
          <div>
            <p className="text-7xl leading-none font-medium tracking-tight md:text-9xl">
              <span className="sr-only">
                {temperature} degrees {units === "metric" ? "Celsius" : "Fahrenheit"}
              </span>
              <span aria-hidden="true">
                {temperature}
                <span className="align-top text-3xl font-normal text-(--brand-teal-text) md:text-5xl">
                  {units === "metric" ? "°C" : "°F"}
                </span>
              </span>
            </p>
            <p className="mt-1 text-lg">{weather.label}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 pt-4 pb-5 md:px-10 dark:border-white/10">
        <HourStrip forecast={forecast} units={units} tone="glass" />
      </div>
    </header>
  );
}
