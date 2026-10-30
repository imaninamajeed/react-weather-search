import { Suspense } from "react";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { PalettePlaces } from "./palette-places";
import { SearchCommand } from "./search-command";

/** The places you follow (home first) live in the cookie, so they arrive after the shell. */
async function FollowedPlaces() {
  const preferences = await getPreferences();
  const home = homePlace(preferences);
  const places = [home, ...preferences.places.filter((place) => place.key !== home.key)];
  return <PalettePlaces places={places} homeKey={home.key} />;
}

/**
 * The app's one command palette. It is mounted once, here, and opened by ⌘K, "/" or any
 * SearchTrigger, so two triggers on the page never open two dialogs. It is part of the static shell
 * (so it is ready as soon as the page hydrates); the places it offers stream in beside it.
 */
export function SearchHost() {
  return (
    <>
      <SearchCommand trigger={false} />
      <Suspense fallback={null}>
        <FollowedPlaces />
      </Suspense>
    </>
  );
}
