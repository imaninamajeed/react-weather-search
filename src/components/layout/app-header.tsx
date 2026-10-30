import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SearchTrigger } from "@/components/search/search-command";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { PreferenceControls } from "./preference-controls";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * The one header, at every size: the sidebar toggle, where you are (the @crumbs slot knows the route
 * and the place, and its place crumb switches place), and search. On a phone the toggle opens the
 * sidebar as a drawer, the brand appears (the sidebar's is out of sight) and the breadcrumb wraps to a
 * row of its own.
 */
export function AppHeader({ crumbs }: { crumbs: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-2 border-b border-border bg-background/85 px-4 py-2 backdrop-blur">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mx-1 hidden h-4 md:block" />
      <Link
        href="/dashboard"
        aria-label="Isobar home"
        className="flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden md:hidden"
      >
        <IsobarMark detail="compact" animated className="size-8" />
        <span className="font-heading text-xl leading-none">Isobar</span>
      </Link>

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
