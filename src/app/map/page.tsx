import type { Metadata } from "next";
import { Suspense } from "react";
import { WeatherMap, type MapPlace } from "@/components/map/weather-map";
import { Skeleton } from "@/components/ui/skeleton";
import { getForecast } from "@/lib/open-meteo/forecast";
import { getRadarFrames } from "@/lib/radar";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { formatTemperature } from "@/lib/units";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Live rain radar with your saved places. Click anywhere for the weather at that spot.",
};

async function MapContent() {
  const preferences = await getPreferences();
  const home = homePlace(preferences);
  const places = [home, ...preferences.places.filter((place) => place.key !== home.key)];

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
      key={`${preferences.units}:${markers.map((marker) => marker.key).join(",")}`}
      places={markers}
      radar={radar && radar.frames.length > 0 ? radar : null}
      units={preferences.units}
      center={{ latitude: home.latitude, longitude: home.longitude }}
    />
  );
}

export default function MapPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <header className="mb-6">
        <p className="label-caps">Live radar</p>
        <h1 className="mt-2 font-heading text-5xl leading-[0.95] md:text-6xl">Map</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Rain radar for the last two hours, with the places you follow. Click anywhere for the
          weather at that spot.
        </p>
      </header>
      <Suspense fallback={<Skeleton aria-hidden="true" className="h-[60svh] w-full rounded-xl" />}>
        <MapContent />
      </Suspense>
    </main>
  );
}
