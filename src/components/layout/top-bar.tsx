import { Suspense, type ReactNode } from "react";
import { SearchCommand } from "@/components/search/search-command";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getPreferences } from "@/lib/preferences";
import { SettingsMenu } from "./settings-menu";

/** Units live in a cookie, so the menu streams in behind a same-size placeholder. */
async function Settings() {
  const { units } = await getPreferences();
  return <SettingsMenu units={units} />;
}

/**
 * The sidebar trigger, the page's breadcrumb (rendered by the @crumbs slot, which knows the route and
 * the place), then search and settings.
 */
export function TopBar({ crumbs }: { crumbs: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <div className="min-w-0 flex-1">
        <Suspense fallback={null}>{crumbs}</Suspense>
      </div>
      <div className="shrink-0 sm:w-64">
        <SearchCommand />
      </div>
      <Suspense
        fallback={<Button variant="outline" size="icon" disabled aria-label="Settings loading" />}
      >
        <Settings />
      </Suspense>
    </header>
  );
}
