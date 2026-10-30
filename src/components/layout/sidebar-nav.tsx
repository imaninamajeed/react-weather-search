"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DESTINATIONS, isActive } from "./main-nav-client";

/** The mark's own magenta-to-teal, running down the edge of whatever you are on. */
export const CURRENT_EDGE =
  "relative data-active:before:absolute data-active:before:inset-y-2 data-active:before:left-0 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-linear-to-b data-active:before:from-(--brand-magenta) data-active:before:to-(--brand-teal)";

/** The four destinations. A null pathname renders no highlight, for the prerendered shell. */
export function SidebarNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main">
      <SidebarMenu>
        {DESTINATIONS.map((destination) => {
          const active = isActive(destination, pathname);
          return (
            <SidebarMenuItem key={destination.href}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={destination.label}
                className={CURRENT_EDGE}
              >
                <Link href={destination.href} aria-current={active ? "page" : undefined}>
                  {destination.icon}
                  <span>{destination.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}

/** Reads the URL, which is request-time data, so it must render inside <Suspense>. */
export function ActiveSidebarNav() {
  return <SidebarNavView pathname={usePathname()} />;
}

/** On a phone the sidebar is a drawer; go where you tapped and put it away. */
export function CloseDrawerOnNavigate() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile]);
  return null;
}
