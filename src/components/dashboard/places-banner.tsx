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
  const figures = [{ label: "Places", value: places.length }];
  if (countries.size > 0) figures.push({ label: "Countries", value: countries.size });

  return (
    <PageBanner
      id="places-banner"
      label="Manage and Compare"
      title={
        none
          ? "No places yet"
          : `Following ${places.length} ${places.length === 1 ? "place" : "places"}`
      }
      lead={
        none
          ? "Search for a city to follow it here, and compare the week ahead across all of them."
          : `Home is ${home.name}. Reorder your places, choose another home, and compare the week ahead.`
      }
      aside={<BannerFigures figures={figures} />}
    />
  );
}
