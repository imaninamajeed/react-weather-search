import {
  IconAlertTriangle,
  IconLayoutDashboard,
  IconListDetails,
  IconMap,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavLink } from "./sidebar-nav-link";
import { SidebarPlaces } from "./sidebar-places";

function PlacesSkeleton() {
  return (
    <SidebarMenu aria-hidden="true">
      {["70%", "55%", "80%"].map((width) => (
        <SidebarMenuItem key={width}>
          <SidebarMenuSkeleton showIcon width={width} />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

/** Navigation and the places you follow. Collapses to icons on desktop and becomes a drawer on mobile. */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Isobar">
              <Link href="/" aria-label="Isobar home">
                <Image
                  src="/brand/mark.webp"
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-lg"
                  priority
                />
                <span className="font-heading text-xl leading-none">Isobar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNavLink href="/" exact icon={<IconLayoutDashboard aria-hidden="true" />}>
                Dashboard
              </SidebarNavLink>
              <SidebarNavLink href="/alerts" icon={<IconAlertTriangle aria-hidden="true" />}>
                Alerts
              </SidebarNavLink>
              <SidebarNavLink href="/places" icon={<IconListDetails aria-hidden="true" />}>
                Places
              </SidebarNavLink>
              <SidebarNavLink href="/map" icon={<IconMap aria-hidden="true" />}>
                Radar map
              </SidebarNavLink>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your places</SidebarGroupLabel>
          <SidebarGroupContent>
            <Suspense fallback={<PlacesSkeleton />}>
              <SidebarPlaces />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Weather data by{" "}
          <a
            href="https://open-meteo.com/"
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo
          </a>
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
