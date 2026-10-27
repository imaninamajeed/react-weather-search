import { IconHome, IconMapPin } from "@tabler/icons-react";
import { SidebarMenu } from "@/components/ui/sidebar";
import { placeHref } from "@/lib/places";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { SidebarNavLink } from "./sidebar-nav-link";

/** The home place first, then the saved ones. Reads the cookie, so it streams behind a skeleton. */
export async function SidebarPlaces() {
  const preferences = await getPreferences();
  const home = homePlace(preferences);
  const others = preferences.places.filter((place) => place.key !== home.key);

  return (
    <>
      <SidebarMenu>
        <SidebarNavLink href={placeHref(home)} icon={<IconHome aria-hidden="true" />}>
          {home.name}
        </SidebarNavLink>
        {others.map((place) => (
          <SidebarNavLink
            key={place.key}
            href={placeHref(place)}
            icon={<IconMapPin aria-hidden="true" />}
          >
            {place.name}
          </SidebarNavLink>
        ))}
      </SidebarMenu>
      {preferences.places.length === 0 && (
        <p className="px-2 pt-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Save a place from its forecast page and it appears here.
        </p>
      )}
    </>
  );
}
