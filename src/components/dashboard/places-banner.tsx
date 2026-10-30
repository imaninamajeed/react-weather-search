import { BannerFigures, PageBanner } from "@/components/shared/page-banner";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";

/** The Places page's banner (see PageBanner): how many places you follow, across how many countries, and which is home. */
export async function PlacesBanner() {
  const preferences = await getPreferences();
  const { places } = preferences;
  const home = homePlace(preferences);
  const countries = new Set(
    places.map((place) => place.country ?? place.countryCode).filter(Boolean),
  );

  const none = places.length === 0;
  const figures = [{ label: "Locations", value: places.length }];
  if (countries.size > 0) figures.push({ label: "Countries", value: countries.size });

  return (
    <PageBanner
      id="places-banner"
      label="Locations"
      title={
        none
          ? "No locations yet"
          : `Following ${places.length} ${places.length === 1 ? "location" : "locations"}`
      }
      lead={
        none
          ? "Search for a city to follow it and compare the week ahead."
          : `Home is ${home.name}. Reorder, change home, compare the week.`
      }
      aside={<BannerFigures figures={figures} />}
    />
  );
}
