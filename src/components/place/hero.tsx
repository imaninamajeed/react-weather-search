import type { ReactNode } from "react";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { HourStrip } from "@/components/dashboard/hour-strip";
import { formatPlaceSubtitle, formatUtcOffset, formatWeekdayClock } from "@/lib/format";
import type { Place } from "@/lib/places";
import { convertTemperature } from "@/lib/units";
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
}

const caption =
  "font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase dark:text-white/75";

/**
 * The opening panel of the dashboard and of a place's forecast: the place lit by the app mark's
 * magenta and teal, with the isobars of its logo drawn large in the top-right corner. Dark mode
 * uses the mark's own ink; light mode is a white panel with the same colours washed out. The art
 * is faded out well before the text, which always sits on a plain, low-chroma surface.
 */
export function PlaceHero({ place, forecast, units, actions, headingLevel = 1 }: PlaceHeroProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
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
            {actions}
          </div>
          <Heading
            id="place-title"
            className="mt-3 font-heading text-5xl leading-[0.95] md:text-7xl"
          >
            {place.name}
          </Heading>
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
