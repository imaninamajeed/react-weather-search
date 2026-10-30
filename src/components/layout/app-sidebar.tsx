import Link from "next/link";
import { Suspense } from "react";
import { IsobarMark } from "@/components/shared/isobar-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ActiveSidebarAbout, SidebarAboutView } from "./sidebar-about";
import { SidebarPlaces } from "./sidebar-places";
import { ActiveSidebarNav, CloseDrawerOnNavigate, SidebarNavView } from "./sidebar-nav";

const linkClass =
  "underline decoration-sidebar-border underline-offset-4 hover:text-sidebar-foreground";

/**
 * The app's navigation from md up (and, on a phone, the drawer behind the menu button): where you
 * can go, who you are following and what it is doing. It collapses to an icon rail (⌘B, the header's toggle or the rail's edge) and stays put while the page
 * beside it changes, so every other page can spend its whole width on weather.
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Isobar">
              <Link href="/dashboard" aria-label="Isobar Home">
                <IsobarMark detail="compact" animated className="size-8!" />
                <span className="font-heading text-2xl leading-none">Isobar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-0">
          <Suspense fallback={<SidebarNavView pathname={null} />}>
            <ActiveSidebarNav />
          </Suspense>
        </SidebarGroup>
        <SidebarPlaces />
      </SidebarContent>

      <SidebarFooter>
        <Suspense fallback={<SidebarAboutView pathname={null} />}>
          <ActiveSidebarAbout />
        </Suspense>
        {/* Attribution and credit, which the icon rail has no room for. */}
        <div className="space-y-1 px-2 pb-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          <p>
            Weather data by{" "}
            <a
              href="https://open-meteo.com/"
              className={linkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo.com
            </a>{" "}
            (CC BY 4.0)
          </p>
          <p>
            Built by{" "}
            <a
              href="https://www.linkedin.com/in/imaninamajeed/"
              className={linkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              Imanina
            </a>
            {" · "}
            <a
              href="https://github.com/imaninamajeed"
              className={linkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
      <Suspense fallback={null}>
        <CloseDrawerOnNavigate />
      </Suspense>
    </Sidebar>
  );
}
