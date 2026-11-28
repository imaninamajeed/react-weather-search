import { IconDroplet } from "@tabler/icons-react";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatHour } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Forecast, Units } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

const HOURS = 12;

/**
 * For an adaptive strip, when each hour's tile appears. Widths are the strip's own (a container
 * query), measured against a tile's 4rem minimum plus its gap: 5 tiles from 24rem, 6 from 28rem, 8
 * from 36rem, 10 from 48rem, 12 from 56rem. Below 24rem (a phone) nothing is hidden: it swipes.
 */
function appearsAt(index: number) {
  if (index < 5) return undefined;
  if (index < 6) return "@sm:hidden @md:flex";
  if (index < 8) return "@sm:hidden @xl:flex";
  if (index < 10) return "@sm:hidden @3xl:flex";
  return "@sm:hidden @4xl:flex";
}

/**
 * The next twelve hours as a horizontally scrolling strip of soft pills, "Now" picked out in a
 * solid pill with the brand's magenta dot. `glass` is for sitting on a sky: translucent pills in the
 * sky's own surface and ink (see SkyPanel), in either theme.
 */
export async function HourStrip({
  forecast,
  units,
  tone = "default",
  hours = HOURS,
  compact = false,
  adaptive = false,
  className,
}: {
  forecast: Forecast;
  units: Units;
  tone?: "default" | "glass";
  hours?: number;
  /** Shorter tiles, for squeezing the strip into a fixed-height page. */
  compact?: boolean;
  /**
   * Show only as many hours as the strip's own width holds, so no tile is ever cut off by the edge.
   * On a phone, where the strip is a swipe, every hour stays and the edge fades.
   */
  adaptive?: boolean;
  /** Replaces the bleed past the parent's padding, for use outside the hero. */
  className?: string;
}) {
  const { locale, t } = await getI18n();
  const glass = tone === "glass";
  const list = (
    <ol
      className={cn(
        "relative -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:-mx-10 md:px-10",
        adaptive && "snap-x @max-sm:[mask-image:linear-gradient(to_right,black_88%,transparent)]",
        className,
      )}
      aria-label={t.dashboard.nextHours(hours)}
      // It scrolls sideways when the hours outrun the width, so a keyboard needs to be able to reach it.
      tabIndex={0}
    >
      {forecast.hourly.slice(0, hours).map((hour, index) => {
        const weather = describeWeather(hour.weatherCode, hour.isDay, locale);
        const now = index === 0;
        return (
          <li
            key={hour.time}
            className={cn(
              "flex min-w-16 flex-1 shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-3",
              compact && "gap-1 py-2",
              adaptive && cn("snap-start", appearsAt(index)),
              glass
                ? cn("bg-background backdrop-blur-sm", now && "bg-card ring-1 ring-border")
                : cn("bg-muted/70", now && "bg-primary/10 ring-1 ring-primary/30"),
            )}
          >
            <span className="inline-flex items-center gap-1 font-heading text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {now && (
                <span aria-hidden="true" className="size-1.5 rounded-full bg-(--brand-magenta)" />
              )}
              {now ? t.common.now : formatHour(hour.time, locale)}
            </span>
            <WeatherIcon name={weather.icon} className={compact ? "size-6" : "size-7"} />
            <span className="sr-only">{weather.label}</span>
            <span className={cn("text-base font-medium", compact && "text-sm")}>
              {formatTemperature(hour.temperature, units)}
            </span>
            {/* A bare percentage reads as humidity or cloud; the drop and the hidden words say rain. */}
            <span
              className={cn(
                "tnum inline-flex min-h-4 items-center gap-0.5 text-xs",
                glass ? "text-sky-accent" : "text-muted-foreground",
              )}
            >
              {hour.precipitationProbability >= 20 && (
                <>
                  <IconDroplet
                    aria-hidden="true"
                    className={cn("size-3", !glass && "text-icon-rain")}
                  />
                  {hour.precipitationProbability}%
                  <span className="sr-only"> {t.place.daily.chanceOfRain}</span>
                </>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
  return adaptive ? <div className="@container">{list}</div> : list;
}
