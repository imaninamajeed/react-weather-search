import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { getTranslations } from "@/lib/i18n/server";
import { Text } from "@/lib/i18n/text";
import { getPreferences } from "@/lib/preferences";
import { lookupPlace } from "@/lib/resolve-place";
import { PlaceBreadcrumb } from "./place-breadcrumb";

/**
 * The header breadcrumb for a place's pages. It resolves the place itself (cached) and shows the
 * saved locations in the switcher; an unknown place gets the generic trail, since the page below
 * renders the not-found state.
 */
export async function PlaceCrumbs({
  params,
  view,
}: {
  params: Promise<{ key: string }>;
  view: "forecast" | "outlook" | "climate";
}) {
  const { key } = await params;
  const [place, preferences, t] = await Promise.all([
    lookupPlace(key),
    getPreferences(),
    getTranslations(),
  ]);
  if (!place) {
    return (
      <PageBreadcrumb
        trail={[
          { label: <Text id="nav.dashboard" />, href: "/dashboard" },
          { label: <Text id="nav.locations" />, href: "/places" },
        ]}
      />
    );
  }
  return <PlaceBreadcrumb place={place} view={view} saved={preferences.places} t={t} />;
}
