import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { placeHref, type Place } from "@/lib/places";

const SUFFIX = { Forecast: "", Outlook: "/outlook", Climate: "/history" } as const;

/**
 * Dashboard › Places › <place ▾> › <view>. The dropdown switches to another place you follow and keeps
 * the view you are on (so "Tokyo's outlook" becomes "London's outlook", not London's forecast).
 */
export function PlaceBreadcrumb({
  place,
  view,
  saved,
}: {
  place: Place;
  view: keyof typeof SUFFIX;
  /** The places the visitor follows. */
  saved: Place[];
}) {
  const suffix = SUFFIX[view];
  const options = [...saved, ...(saved.some((p) => p.key === place.key) ? [] : [place])];

  return (
    <PageBreadcrumb
      trail={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Places", href: "/places" },
        {
          label: place.name,
          href: placeHref(place),
          switcher: {
            label: "Switch place",
            items: options.map((option) => ({
              label: option.name,
              href: `${placeHref(option)}${suffix}`,
              current: option.key === place.key,
            })),
            footer: { label: "All places", href: "/places" },
          },
        },
        { label: view },
      ]}
    />
  );
}
