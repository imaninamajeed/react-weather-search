"use client";

import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconHome,
  IconMapPin,
  IconPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { OPEN_SEARCH_EVENT } from "@/components/search/search-command";
import { WeatherIcon } from "@/components/shared/weather-icon";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMessages } from "@/lib/i18n/client";
import type { AlertSeverity } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";
import type { WeatherIconName } from "@/lib/weather/codes";
import { CURRENT_EDGE } from "./sidebar-nav";

export interface PlaceRow {
  key: string;
  name: string;
  href: string;
  home: boolean;
  /** Null while the forecast is unavailable: the row still works as a link. */
  temperature: string | null;
  icon: WeatherIconName | null;
  condition: string | null;
  severity: AlertSeverity | null;
}

const PLACE_PAGE = /^\/place\/[^/]+(\/outlook|\/history)?$/;

/**
 * The places you follow, home first, each with what it is doing right now. This is the app's one
 * place switcher: on a place's page, switching keeps the view you are on (Forecast, Outlook or
 * Climate). A null pathname renders no selection, for the prerendered shell.
 */
export function SidebarPlacesView({
  places,
  pathname,
}: {
  places: PlaceRow[];
  pathname: string | null;
}) {
  const { setOpenMobile } = useSidebar();
  const t = useMessages();
  const view = pathname?.match(PLACE_PAGE)?.[1] ?? "";
  const currentRef = useRef<HTMLAnchorElement>(null);

  // A long list scrolls; keep the place you are on in sight.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <SidebarGroup className="min-h-0 flex-1">
      <SidebarGroupLabel>{t.nav.yourLocations}</SidebarGroupLabel>
      <SidebarGroupAction
        aria-label={t.nav.followAnother}
        title={t.nav.followAnother}
        onClick={() => {
          setOpenMobile(false);
          window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
        }}
      >
        <IconPlus aria-hidden="true" />
      </SidebarGroupAction>
      <SidebarGroupContent className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        <nav aria-label={t.nav.yourLocations}>
          <SidebarMenu>
            {places.map((place) => {
              const current =
                pathname !== null &&
                (pathname === place.href || pathname.startsWith(`${place.href}/`));
              const SeverityIcon =
                place.severity === "warning" ? IconAlertOctagon : IconAlertTriangle;
              return (
                <SidebarMenuItem key={place.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={current}
                    tooltip={
                      place.temperature ? `${place.name} · ${place.temperature}` : place.name
                    }
                    className={CURRENT_EDGE}
                  >
                    <Link
                      ref={current ? currentRef : undefined}
                      href={`${place.href}${view}`}
                      aria-current={current ? "page" : undefined}
                    >
                      {place.icon ? (
                        <WeatherIcon name={place.icon} className="text-muted-foreground" />
                      ) : (
                        <IconMapPin aria-hidden="true" className="text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {place.home && <span className="sr-only">{t.nav.homePrefix}</span>}
                        {place.name}
                      </span>
                      {/* Fixed columns on every row (home, alert, temperature), so each kind of marker
                          lines up down the list whether or not a given place has it. */}
                      <span className="flex shrink-0 items-center gap-1">
                        <span
                          aria-hidden="true"
                          className="grid size-4 shrink-0 place-items-center"
                        >
                          {place.home && <IconHome className="text-muted-foreground" />}
                        </span>
                        <span className="grid size-4 shrink-0 place-items-center">
                          {place.severity && (
                            <>
                              <SeverityIcon
                                aria-hidden="true"
                                className={cn(
                                  place.severity === "warning" ? "text-warning" : "text-advisory",
                                )}
                              />
                              <span className="sr-only">
                                {place.severity === "warning"
                                  ? t.common.warning
                                  : t.common.advisory}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="w-9 shrink-0 text-right tabular-nums">
                          {place.temperature && (
                            <>
                              <span className="sr-only">{place.condition}, </span>
                              {place.temperature}
                            </>
                          )}
                        </span>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** Reads the URL, which is request-time data, so it must render inside <Suspense> (see SidebarPlaces). */
export function ActiveSidebarPlaces({ places }: { places: PlaceRow[] }) {
  return <SidebarPlacesView places={places} pathname={usePathname()} />;
}
