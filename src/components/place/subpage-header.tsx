import { sceneFor, SkyPanel } from "@/components/shared/sky-panel";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatPlaceSubtitle } from "@/lib/format";
import type { Place } from "@/lib/places";
import { describeWeather } from "@/lib/weather/codes";
import type { Forecast } from "@/lib/weather/types";

/**
 * The heading block shared by a place's sub-pages (outlook, climate): what this view is, and for
 * where, on a slim panel of the sky over the place right now (see SkyPanel) with its condition's
 * icon, so the sub-pages feel like the same place as its forecast.
 */
export function SubpageHeader({
  label,
  place,
  lead,
  forecast,
}: {
  label: string;
  place: Place;
  lead: string;
  forecast: Forecast;
}) {
  const { icon } = describeWeather(forecast.current.weatherCode, forecast.current.isDay);
  return (
    <SkyPanel
      as="header"
      scene={sceneFor(forecast)}
      className="flex items-center justify-between gap-6 p-6 sm:p-8 fit:px-6 fit:py-4"
    >
      <div className="min-w-0">
        <p className="label-caps">{label}</p>
        <h1 className="mt-2 font-heading text-5xl leading-[0.95] md:text-6xl fit:mt-1 fit:text-4xl">
          {place.name}
        </h1>
        <div className="fit:mt-1 fit:flex fit:flex-wrap fit:items-baseline fit:gap-x-4">
          <p className="mt-2 text-muted-foreground fit:mt-0">{formatPlaceSubtitle(place)}</p>
          <p className="mt-4 max-w-prose text-lg text-balance fit:mt-0 fit:text-base">{lead}</p>
        </div>
      </div>
      <WeatherIcon
        name={icon}
        animated
        className="hidden size-24 drop-shadow-lg sm:block md:size-28 fit:size-16"
      />
    </SkyPanel>
  );
}
