import { BannerFigures, PageBanner } from "@/components/shared/page-banner";
import { getI18n } from "@/lib/i18n/server";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";

/**
 * The Locations page's banner (see PageBanner), in the Alerts page's style: a small label, a short
 * headline (how many you follow), a line saying which is home, and on the right how many countries
 * they span. The headline is the count alone because the list below is the page.
 */
export async function PlacesBanner() {
  const [preferences, { t }] = await Promise.all([getPreferences(), getI18n()]);
  const text = t.dashboard.banner;
  const { places } = preferences;
  const home = homePlace(preferences);
  const countries = new Set(
    places.map((place) => place.country ?? place.countryCode).filter(Boolean),
  );

  const none = places.length === 0;
  return (
    <PageBanner
      id="places-banner"
      label={text.label}
      title={none ? text.none : text.following(places.length)}
      lead={none ? text.leadNone : text.lead(home.name)}
      aside={
        countries.size > 0 ? (
          <BannerFigures figures={[{ label: text.countries, value: countries.size }]} />
        ) : undefined
      }
    />
  );
}
