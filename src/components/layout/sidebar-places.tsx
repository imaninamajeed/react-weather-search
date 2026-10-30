import { Suspense } from "react";
import { getPlaceAlerts } from "@/lib/alerts";
import { highestSeverity } from "@/lib/alerts/describe";
import { getForecast } from "@/lib/open-meteo/forecast";
import { placeHref } from "@/lib/places";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ActiveSidebarPlaces, SidebarPlacesView, type PlaceRow } from "./sidebar-places-client";

/**
 * The names and links come from the cookie, so they always render; the live temperature and alert
 * marker come from the network, one place at a time, and a failure there only drops that detail.
 */
async function Places() {
  const preferences = await getPreferences();
  const home = homePlace(preferences);
  const places = [home, ...preferences.places.filter((place) => place.key !== home.key)];

  const rows: PlaceRow[] = await Promise.all(
    places.map(async (place): Promise<PlaceRow> => {
      const base = {
        key: place.key,
        name: place.name,
        href: placeHref(place),
        home: place.key === home.key,
      };
      try {
        const forecast = await getForecast(place.latitude, place.longitude);
        const weather = describeWeather(forecast.current.weatherCode, forecast.current.isDay);
        const { alerts } = await getPlaceAlerts(place, forecast);
        return {
          ...base,
          temperature: formatTemperature(forecast.current.temperature, preferences.units),
          icon: weather.icon,
          condition: weather.label,
          severity: highestSeverity(alerts),
        };
      } catch {
        return { ...base, temperature: null, icon: null, condition: null, severity: null };
      }
    }),
  );

  return (
    <Suspense fallback={<SidebarPlacesView places={rows} pathname={null} />}>
      <ActiveSidebarPlaces places={rows} />
    </Suspense>
  );
}

// Fixed widths: the stock SidebarMenuSkeleton picks one at random, which a prerendered shell can't do.
function PlacesSkeleton() {
  return (
    <SidebarGroup aria-hidden="true">
      <SidebarMenu>
        {[0, 1].map((row) => (
          <SidebarMenuItem key={row}>
            <div className="flex h-9 items-center gap-2 px-3">
              <Skeleton className="size-4 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function SidebarPlaces() {
  return (
    <Suspense fallback={<PlacesSkeleton />}>
      <Places />
    </Suspense>
  );
}
