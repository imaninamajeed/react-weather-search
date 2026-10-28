import { Suspense } from "react";
import { placeHref } from "@/lib/places";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { PlacesMenu, PlacesMenuButton, type PlaceOption } from "./places-menu";

/** The home place first, then the saved ones. Reads the cookie, so it streams in behind a placeholder. */
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
  return <PlacesMenu places={places} hasSaved={preferences.places.length > 0} />;
}

/** Desktop only: on phones the Places tab does this job. */
export function PlacesSwitcher() {
  return (
    <div className="hidden lg:block">
      <Suspense fallback={<PlacesMenuButton disabled />}>
        <Places />
      </Suspense>
    </div>
  );
}
