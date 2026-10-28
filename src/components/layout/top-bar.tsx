import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SearchCommand } from "@/components/search/search-command";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { getPreferences } from "@/lib/preferences";
import { MainNav } from "./main-nav";
import { PlacesStrip } from "./places-strip";
import { InstallButton, ThemeToggle, UnitsToggle } from "./preference-toggles";

/** Units live in a cookie, so the toggle streams in behind a disabled copy of itself. */
async function Units() {
  const { units } = await getPreferences();
  return <UnitsToggle units={units} />;
}

/**
 * The brand and the four destinations on desktop (smaller screens get a bottom tab bar instead), then
 * search, the units and theme toggles, and an install button when the browser offers one.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <Link
          href="/"
          aria-label="Isobar home"
          className="mr-2 flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden"
        >
          <IsobarMark detail="compact" animated className="size-8" />
          <span className="font-heading text-xl leading-none max-sm:hidden">Isobar</span>
        </Link>
        <MainNav variant="top" />
        <div className="min-w-0 flex-1" />
        <div className="shrink-0 sm:w-64 lg:w-44 xl:w-64">
          <SearchCommand />
        </div>
        <Suspense fallback={<UnitsToggle units={null} />}>
          <Units />
        </Suspense>
        <ThemeToggle />
        <InstallButton />
      </div>
    </header>
  );
}

/**
 * Where you are in the app (the @crumbs slot knows the route and the place), and on desktop a toggle per
 * place you follow.
 */
export function CrumbBar({ crumbs }: { crumbs: ReactNode }) {
  return (
    <div className="mx-auto flex h-10 w-full max-w-6xl items-center gap-4 px-4">
      <div className="min-w-0 flex-1">
        <Suspense fallback={null}>{crumbs}</Suspense>
      </div>
      <PlacesStrip />
    </div>
  );
}
