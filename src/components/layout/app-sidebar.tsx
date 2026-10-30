import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarCredits } from "./sidebar-credits";
import { ActiveSidebarAbout, SidebarAboutView } from "./sidebar-about";
import { SidebarPlaces } from "./sidebar-places";
import { ActiveSidebarNav, CloseDrawerOnNavigate, SidebarNavView } from "./sidebar-nav";

/**
 * The app's navigation from md up (a phone has the bottom tab bar instead): where you
 * can go, who you are following and what it is doing. It collapses to an icon rail (⌘B, the header's toggle or the rail's edge) and stays put while the page
 * beside it changes, so every other page can spend its whole width on weather.
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarBrand />
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
        <SidebarCredits />
      </SidebarFooter>

      <SidebarRail />
      <Suspense fallback={null}>
        <CloseDrawerOnNavigate />
      </Suspense>
    </Sidebar>
  );
}
