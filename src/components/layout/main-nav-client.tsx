"use client";

import {
  IconAlertTriangle,
  IconLayoutDashboard,
  IconListDetails,
  IconMap,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Destination {
  href: string;
  label: string;
  icon: ReactNode;
  /** Match only this exact path, instead of this path and everything below it. */
  exact?: boolean;
}

export const DESTINATIONS: Destination[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <IconLayoutDashboard aria-hidden="true" />,
    exact: true,
  },
  { href: "/alerts", label: "Alerts", icon: <IconAlertTriangle aria-hidden="true" /> },
  { href: "/places", label: "Places", icon: <IconListDetails aria-hidden="true" /> },
  { href: "/map", label: "Map", icon: <IconMap aria-hidden="true" /> },
];

export function isActive(destination: Destination, pathname: string | null) {
  if (pathname === null) return false;
  return destination.exact
    ? pathname === destination.href
    : pathname === destination.href || pathname.startsWith(`${destination.href}/`);
}

/** The destinations as a bottom tab bar, for phones; from md up the sidebar lists them instead. */
export function MainNavView({
  pathname,
}: {
  /** Null renders no highlight, for the prerendered shell. */
  pathname: string | null;
}) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-4">
        {DESTINATIONS.map((destination) => {
          const active = isActive(destination, pathname);
          return (
            <li key={destination.href} className="flex">
              <Link
                href={destination.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden [&_svg]:size-5 [&_svg]:shrink-0",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {destination.icon}
                <span>{destination.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Reads the URL, which is request-time data, so it must render inside <Suspense> (see MainNav). */
export function ActiveMainNav() {
  return <MainNavView pathname={usePathname()} />;
}
