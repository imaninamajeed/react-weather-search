import { Suspense, type ReactNode } from "react";
import { SearchTrigger } from "@/components/search/search-command";
import { HeaderBrand } from "./header-brand";
import { PreferenceControls } from "./preference-controls";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * The one header, at every size: the sidebar toggle, where you are (the @crumbs slot knows the route
 * and the place, and its place crumb switches place), and search. On a phone there is no sidebar (the
 * tab bar navigates), so the toggle is gone, the brand appears and the breadcrumb wraps to a row of
 * its own.
 */
export function AppHeader({ crumbs }: { crumbs: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-2 border-b border-border bg-background/85 px-4 py-2 backdrop-blur">
      <SidebarTrigger className="-ml-1 hidden shrink-0 md:inline-flex" />
      <Separator orientation="vertical" className="mx-1 hidden h-4 md:block" />
      <HeaderBrand />

      <div className="flex h-8 min-w-0 items-center max-md:order-last max-md:basis-full md:flex-1">
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>{crumbs}</Suspense>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="sm:w-64">
          <SearchTrigger />
        </div>
        <PreferenceControls />
      </div>
    </header>
  );
}
