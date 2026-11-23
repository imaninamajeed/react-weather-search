import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import type { Messages } from "@/lib/i18n/messages";
import { placeHref, type Place } from "@/lib/places";

const SUFFIX = { forecast: "", outlook: "/outlook", climate: "/history" } as const;

/**
 * Dashboard › Places › <place ▾> › <view>. The dropdown switches to another place you follow and keeps
 * the view you are on (so "Tokyo's outlook" becomes "London's outlook", not London's forecast).
 */
export function PlaceBreadcrumb({
  place,
  view,
  saved,
  t,
}: {
  place: Place;
  view: keyof typeof SUFFIX;
  /** The places the visitor follows. */
  saved: Place[];
  t: Messages;
}) {
  const suffix = SUFFIX[view];
  const options = [...saved, ...(saved.some((p) => p.key === place.key) ? [] : [place])];

  return (
    <PageBreadcrumb
      trail={[
        { label: t.nav.dashboard, href: "/dashboard" },
        { label: t.nav.locations, href: "/places" },
        {
          label: place.name,
          href: placeHref(place),
          switcher: {
            label: t.nav.switchLocation,
            items: options.map((option) => ({
              label: option.name,
              href: `${placeHref(option)}${suffix}`,
              current: option.key === place.key,
            })),
            footer: { label: t.nav.allLocations, href: "/places" },
          },
        },
        { label: t.nav[view] },
      ]}
    />
  );
}
