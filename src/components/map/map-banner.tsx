import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { BannerFigures, PageBanner } from "@/components/shared/page-banner";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { placeHref } from "@/lib/places";
import { lookupPlace } from "@/lib/resolve-place";

/** Radar opened from a place keeps a way back to that place's forecast. */
async function BackToPlace({ placeKey }: { placeKey: string | string[] | undefined }) {
  const [place, { t }] = await Promise.all([
    typeof placeKey === "string" ? lookupPlace(placeKey) : null,
    getI18n(),
  ]);
  if (!place) return null;
  return (
    <Button asChild variant="outline" size="sm" className="mt-5">
      <Link href={placeHref(place)}>
        <IconArrowLeft aria-hidden="true" />
        {t.map.backToPlace(place.name)}
      </Link>
    </Button>
  );
}

/**
 * The map page's banner (see PageBanner), in the Alerts page's style: a small label, a short headline
 * for the span the radar covers, a line saying what to do, and on the right how many locations are
 * on the map. When the map was opened from a place, a way back to its forecast sits under the line.
 */
export async function MapBanner({
  searchParams,
}: {
  searchParams: PageProps<"/map">["searchParams"];
}) {
  const [preferences, params, { t }] = await Promise.all([
    getPreferences(),
    searchParams,
    getI18n(),
  ]);
  const text = t.map;
  const home = homePlace(preferences);
  const locations = new Set([home.key, ...preferences.places.map((place) => place.key)]).size;

  return (
    <PageBanner
      id="map-banner"
      label={text.label}
      title={text.banner.title}
      lead={text.lead}
      aside={<BannerFigures figures={[{ label: text.banner.locations, value: locations }]} />}
    >
      <BackToPlace placeKey={params.place} />
    </PageBanner>
  );
}
