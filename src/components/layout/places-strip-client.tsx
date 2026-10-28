"use client";

import { IconHome } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface PlaceOption {
  key: string;
  name: string;
  href: string;
  home: boolean;
}

const PLACE_PAGE = /^\/place\/[^/]+(\/outlook|\/history)?$/;

/** One toggle per place you follow. Null pathname renders no selection, for the prerendered shell. */
export function PlacesStripView({
  places,
  pathname,
}: {
  places: PlaceOption[];
  pathname: string | null;
}) {
  // On a place's page, switching place keeps the view (Forecast, Outlook or Climate), like the breadcrumb does.
  const view = pathname?.match(PLACE_PAGE)?.[1] ?? "";
  const currentRef = useRef<HTMLAnchorElement>(null);

  // Ten places can overflow the row; make sure the selected one is in sight.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <nav aria-label="Your places" className="min-w-0">
      <ul className="flex [scrollbar-width:none] items-center gap-1 overflow-x-auto py-1">
        {places.map((place) => {
          const current =
            pathname !== null && (pathname === place.href || pathname.startsWith(`${place.href}/`));
          return (
            <li key={place.key} className="shrink-0">
              <Link
                ref={current ? currentRef : undefined}
                href={`${place.href}${view}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden",
                  current
                    ? "border-transparent bg-primary font-medium text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {place.home && <IconHome aria-hidden="true" className="size-3.5" />}
                {place.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Reads the URL, which is request-time data, so it must render inside <Suspense> (see PlacesStrip). */
export function ActivePlacesStrip({ places }: { places: PlaceOption[] }) {
  return <PlacesStripView places={places} pathname={usePathname()} />;
}
