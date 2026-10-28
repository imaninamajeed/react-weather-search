import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { placeHref } from "@/lib/places";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { ActivePlacesStrip, PlacesStripView, type PlaceOption } from "./places-strip-client";

/** The home place first, then the saved ones. Reads the cookie, so it streams in behind a skeleton. */
async function Places() {
  const preferences = await getPreferences();
  const home = homePlace(preferences);
  const places: PlaceOption[] = [home, ...preferences.places.filter((p) => p.key !== home.key)].map(
    (place) => ({
      key: place.key,
      name: place.name,
      href: placeHref(place),
      home: place.key === home.key,
    }),
  );
  return (
    <Suspense fallback={<PlacesStripView places={places} pathname={null} />}>
      <ActivePlacesStrip places={places} />
    </Suspense>
  );
}

/** Desktop only: on phones and tablets the Places tab does this job. */
export function PlacesStrip() {
  return (
    <div className="hidden max-w-[55%] min-w-0 lg:block">
      <Suspense fallback={<Skeleton className="my-1 h-7 w-48" />}>
        <Places />
      </Suspense>
    </div>
  );
}
