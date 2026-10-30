import Link from "next/link";
import { Suspense } from "react";
import { HazardBadge } from "@/components/alerts/hazard-badge";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPlaceSubtitle, formatWeekdayClock } from "@/lib/format";
import { getPlaceAlerts } from "@/lib/alerts";
import { getForecast } from "@/lib/open-meteo/forecast";
import { placeHref, type Place } from "@/lib/places";
import { formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Units } from "@/lib/weather/types";
import { CardControls } from "./card-controls";

async function CardBody({ place, units }: { place: Place; units: Units }) {
  const forecast = await getForecast(place.latitude, place.longitude);
  const { current, daily } = forecast;
  const { alerts } = await getPlaceAlerts(place, forecast);
  const today = daily[0];
  const weather = describeWeather(current.weatherCode, current.isDay);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="label-caps">{formatWeekdayClock(current.time)}</p>
        <HazardBadge alerts={alerts} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-5xl leading-none font-medium tracking-tight">
          {formatTemperature(current.temperature, units)}
        </p>
        <p className="flex items-center gap-2 text-right text-sm">
          <WeatherIcon name={weather.icon} className="size-5" />
          {weather.label}
        </p>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        H {formatTemperature(today.temperatureMax, units)} · L{" "}
        {formatTemperature(today.temperatureMin, units)} · Rain {today.precipitationProbabilityMax}%
      </p>
    </>
  );
}

interface PlaceCardProps {
  place: Place;
  units: Units;
  isHome: boolean;
  /** Manage mode: show reorder / remove controls. */
  manage?: { isFirst: boolean; isLast: boolean };
}

/**
 * The name, link and controls come from the saved snapshot, so they always render. Only
 * the conditions need the network, and a failure there never blocks removing the place.
 */
export function PlaceCard({ place, units, isHome, manage }: PlaceCardProps) {
  return (
    <article className="relative h-full rounded-3xl bg-linear-to-t from-primary/5 to-card p-5 text-card-foreground shadow-xs ring-1 ring-foreground/5 transition-shadow focus-within:shadow-md hover:shadow-md dark:ring-foreground/10 fit:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-2xl leading-tight">
            {/* Stretched link: the whole card is clickable while the controls stay on top of it. */}
            <Link href={placeHref(place)} className="after:absolute after:inset-0">
              {place.name}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{formatPlaceSubtitle(place)}</p>
        </div>
        {isHome && <Badge variant="secondary">Home</Badge>}
      </div>

      <SectionBoundary title={place.name}>
        <Suspense fallback={<Skeleton aria-hidden="true" className="mt-4 h-24 w-full" />}>
          <CardBody place={place} units={units} />
        </Suspense>
      </SectionBoundary>

      {manage && (
        <CardControls
          placeKey={place.key}
          placeName={place.name}
          isHome={isHome}
          isFirst={manage.isFirst}
          isLast={manage.isLast}
        />
      )}
    </article>
  );
}
