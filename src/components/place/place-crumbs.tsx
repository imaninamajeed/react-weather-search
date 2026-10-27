import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { getPreferences } from "@/lib/preferences";
import { lookupPlace } from "@/lib/resolve-place";
import { PlaceBreadcrumb } from "./place-breadcrumb";

/**
 * The header breadcrumb for a place's pages. It resolves the place itself (cached) and shows the
 * saved places in the switcher; an unknown place gets the generic trail, since the page below
 * renders the not-found state.
 */
export async function PlaceCrumbs({
  params,
  view,
}: {
  params: Promise<{ key: string }>;
  view: "Forecast" | "Outlook" | "Climate";
}) {
  const { key } = await params;
  const [place, preferences] = await Promise.all([lookupPlace(key), getPreferences()]);
  if (!place) {
    return (
      <PageBreadcrumb
        trail={[
          { label: "Dashboard", href: "/" },
          { label: "Places", href: "/places" },
        ]}
      />
    );
  }
  return <PlaceBreadcrumb place={place} view={view} saved={preferences.places} />;
}
