import { OfflineBanner } from "@/components/pwa/offline-banner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarMemory } from "@/components/layout/sidebar-memory";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MainNav } from "@/components/layout/main-nav";
import { AppHeader } from "@/components/layout/app-header";

/** The app's shell: sidebar (its footer carries About and the credits), header with the breadcrumb, and the phone's tab bar. */
export default function AppLayout({ children, crumbs }: LayoutProps<"/">) {
  return (
    <>
      {/* From md up the sidebar is the app's navigation; on a phone it is a drawer behind the header's menu button. */}
      <SidebarProvider data-shell className="min-h-0 flex-1">
        <SidebarMemory />
        <AppSidebar />
        {/* Room for the bottom tab bar, which only exists below md. */}
        <div data-column className="flex min-w-0 flex-1 flex-col pb-17 md:pb-0">
          <OfflineBanner />
          <AppHeader crumbs={crumbs} />
          {children}
        </div>
      </SidebarProvider>
      <MainNav />
    </>
  );
}
