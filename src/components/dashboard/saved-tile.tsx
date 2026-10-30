import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HazardBadge } from "@/components/alerts/hazard-badge";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { Button } from "@/components/ui/button";
import { formatPlaceSubtitle } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { placeHref, type Place } from "@/lib/places";
import { convertTemperature, formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Units } from "@/lib/weather/types";
import { loadPlace } from "./load-place";
import { DragGrip, RowMenu } from "./place-row-controls";
import { TileFlip } from "./tile-flip";
import { WeekDetails } from "./week-details";

/**
 * One saved location as a square: its name, what it is doing now, and nothing else. Pointing at it
 * fades in its seven days over the same square (with a link on to the full forecast; a tap does it
 * on touch), so a grid of them can be scanned by moving across it. The menu sits over the tile's
 * corner, outside the button; a finger or pen drags by the grip, a mouse by the tile.
 */
export async function SavedTile({
  place,
  units,
  manage,
}: {
  place: Place;
  units: Units;
  manage: { isFirst: boolean; isLast: boolean };
}) {
  const [{ forecast, alerts }, { locale, t }] = await Promise.all([loadPlace(place), getI18n()]);
  const subtitle = formatPlaceSubtitle(place);
  const current = forecast?.current;
  const today = forecast?.daily[0];
  const weather = current && describeWeather(current.weatherCode, current.isDay, locale);
  const degrees = current ? Math.round(convertTemperature(current.temperature, units)) : 0;

  return (
    <div className="group/row relative aspect-square">
      <TileFlip
        label={t.dashboard.week.details(place.name)}
        title={place.name}
        href={placeHref(place)}
        draggable={!(manage.isFirst && manage.isLast)}
        caption={t.dashboard.week.outlook}
        face={
          <>
            <div className="min-w-0 pr-9">
              <p className="truncate font-heading text-xl leading-tight">{place.name}</p>
              {/* min-h keeps the line when a place has no region or country, so the tiles stay aligned. */}
              <p className="min-h-4 truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {current && today && weather ? (
              <>
                <div>
                  <WeatherIcon name={weather.icon} className="size-7" />
                  <p className="mt-1 font-heading text-5xl leading-none font-medium tracking-tight">
                    <span className="sr-only">
                      {units === "metric"
                        ? t.common.degreesCelsius(degrees)
                        : t.common.degreesFahrenheit(degrees)}
                    </span>
                    <span aria-hidden="true">
                      {degrees}
                      <span className="align-top text-lg font-normal text-(--brand-teal-text)">
                        {units === "metric" ? "°C" : "°F"}
                      </span>
                    </span>
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{weather.label}</p>
                    <p className="tnum text-xs text-muted-foreground">
                      {t.common.high} {formatTemperature(today.temperatureMax, units)} ·{" "}
                      {t.common.low} {formatTemperature(today.temperatureMin, units)}
                    </p>
                  </div>
                  <HazardBadge alerts={alerts} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t.common.unavailable(place.name)}</p>
            )}
          </>
        }
        details={
          forecast ? (
            <WeekDetails forecast={forecast} alerts={alerts} units={units} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.common.unavailable(place.name)}. {t.common.providerDidntRespond}
            </p>
          )
        }
        footer={
          <Button asChild variant="ghost" size="sm" className="ml-auto flex w-fit">
            <Link href={placeHref(place)}>
              {t.dashboard.hero.fullForecast}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <div className="absolute top-2 right-2 z-10 flex items-center">
        {!(manage.isFirst && manage.isLast) && (
          <DragGrip className="[@media(pointer:fine)]:hidden" />
        )}
        <RowMenu
          placeKey={place.key}
          placeName={place.name}
          isHome={false}
          isFirst={manage.isFirst}
          isLast={manage.isLast}
        />
      </div>
    </div>
  );
}
