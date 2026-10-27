import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
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

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur">
      <SidebarTrigger aria-label="Toggle sidebar" />
      {/* The sidebar carries the brand on desktop; on mobile it is tucked in the drawer. */}
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 md:hidden"
        aria-label="Isobar home"
      >
        <Image src="/brand/mark.webp" alt="" width={28} height={28} className="rounded-md" />
      </Link>
      <div className="ml-auto w-full max-w-xs">
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
