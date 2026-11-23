import type { Metadata } from "next";
import { Suspense } from "react";
import { MapBanner } from "@/components/map/map-banner";
import { ReadingMapDialog } from "@/components/map/reading-map-dialog";
import { WeatherMap, type MapPlace } from "@/components/map/weather-map";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/lib/i18n/text";
import { getRadarFrames } from "@/lib/radar";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { lookupPlace } from "@/lib/resolve-place";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Live rain radar with your saved locations. Click anywhere for the weather at that spot.",
};

async function MapContent({ searchParams }: Pick<PageProps<"/map">, "searchParams">) {
  const [preferences, params] = await Promise.all([getPreferences(), searchParams]);
  const home = homePlace(preferences);
  // `?place=<key>` opens the map on that place (a link from each place page), even if it isn't saved.
  const focusKey = typeof params.place === "string" ? params.place : null;
  const focus = focusKey ? await lookupPlace(focusKey) : null;
  const places = [...(focus ? [focus] : []), home, ...preferences.places].filter(
    (place, index, all) => all.findIndex((other) => other.key === place.key) === index,
  );

  // The radar is the only thing that can fail here, and it cannot break the map.
  const radar = await getRadarFrames().catch((error: unknown) => {
    console.error("radar unavailable", error);
    return null;
  });

  const markers: MapPlace[] = places.map((place) => ({
    key: place.key,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    isHome: place.key === home.key,
  }));

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
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 pt-2 pb-6 md:pt-4 fit:pb-3"
    >
      {/* As on the Alerts page, the banner is the page's heading: the `h1` is for assistive tech only. */}
      <h1 className="sr-only">
        <Text id="nav.map" />
      </h1>
      <div className="mb-4 space-y-4 fit:mb-3 fit:space-y-3">
        <Suspense fallback={<Skeleton aria-hidden="true" className="h-56 w-full rounded-4xl" />}>
          <MapBanner searchParams={props.searchParams} />
        </Suspense>
        <div className="flex justify-end">
          <ReadingMapDialog />
        </div>
      </div>
      <Suspense fallback={<Skeleton aria-hidden="true" className="h-[60svh] w-full rounded-xl" />}>
        <MapContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
