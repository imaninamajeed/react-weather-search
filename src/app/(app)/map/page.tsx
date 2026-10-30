import { IconArrowLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { WeatherMap, type MapPlace } from "@/components/map/weather-map";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getForecast } from "@/lib/open-meteo/forecast";
import { getRadarFrames } from "@/lib/radar";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { placeHref } from "@/lib/places";
import { lookupPlace } from "@/lib/resolve-place";
import { formatTemperature } from "@/lib/units";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Live rain radar with your saved places. Click anywhere for the weather at that spot.",
};

/** Radar opened from a place keeps a way back to that place's forecast. */
async function BackToPlace({ searchParams }: Pick<PageProps<"/map">, "searchParams">) {
  const { place: key } = await searchParams;
  const place = typeof key === "string" ? await lookupPlace(key) : null;
  if (!place) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={placeHref(place)}>
        <IconArrowLeft aria-hidden="true" />
        {place.name} forecast
      </Link>
    </Button>
  );
}

async function MapContent({ searchParams }: Pick<PageProps<"/map">, "searchParams">) {
  const [preferences, params] = await Promise.all([getPreferences(), searchParams]);
  const home = homePlace(preferences);
  // `?place=<key>` opens the map on that place (a link from each place page), even if it isn't saved.
  const focusKey = typeof params.place === "string" ? params.place : null;
  const focus = focusKey ? await lookupPlace(focusKey) : null;
  const places = [...(focus ? [focus] : []), home, ...preferences.places].filter(
    (place, index, all) => all.findIndex((other) => other.key === place.key) === index,
  );

  // Temperatures for the markers and the radar load in parallel; neither can break the map.
  const [forecasts, radar] = await Promise.all([
    Promise.allSettled(places.map((place) => getForecast(place.latitude, place.longitude))),
    getRadarFrames().catch((error: unknown) => {
      console.error("radar unavailable", error);
      return null;
    }),
  ]);

  const markers: MapPlace[] = places.flatMap((place, index) => {
    const forecast = forecasts[index];
    return forecast.status === "fulfilled"
      ? [
          {
            key: place.key,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            temperature: formatTemperature(forecast.value.current.temperature, preferences.units),
            isHome: place.key === home.key,
          },
        ]
      : [];
  });

  return (
    <WeatherMap
      // Remount when the places or units change, since the map is created once.
      key={`${preferences.units}:${focus?.key ?? ""}:${markers.map((marker) => marker.key).join(",")}`}
      places={markers}
      radar={radar && radar.frames.length > 0 ? radar : null}
      units={preferences.units}
      center={{
        latitude: (focus ?? home).latitude,
        longitude: (focus ?? home).longitude,
      }}
      focused={focus !== null}
    />
  );
}

export default function MapPage(props: PageProps<"/map">) {
  return (
    <main
      data-wide
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 py-8 fit:pt-3 fit:pb-3"
    >
      <div className="mb-6 space-y-6 fit:mb-3 fit:space-y-0">
        <PageHeader
          label="Live Radar"
          title="Map"
          lead="Rain radar for the last two hours, with the places you follow. Click anywhere for the weather at that spot."
          aside={
            <Suspense fallback={null}>
              <BackToPlace searchParams={props.searchParams} />
            </Suspense>
          }
        />
      </div>
      <Suspense fallback={<Skeleton aria-hidden="true" className="h-[60svh] w-full rounded-xl" />}>
        <MapContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
