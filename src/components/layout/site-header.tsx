import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SearchCommand } from "@/components/search/search-command";
import { Button } from "@/components/ui/button";
import { getPreferences } from "@/lib/preferences";
import { SettingsMenu } from "./settings-menu";

/** Units live in a cookie, so the menu streams in behind a same-size placeholder. */
async function Settings() {
  const { units } = await getPreferences();
  return <SettingsMenu units={units} />;
}

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Isobar home">
          <Image
            src="/brand/mark.webp"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <span className="font-display text-2xl leading-none">Isobar</span>
        </Link>
        <div className="ml-auto w-full max-w-xs">
          <SearchCommand />
        </div>
        <Suspense
          fallback={<Button variant="outline" size="icon" disabled aria-label="Settings loading" />}
        >
          <Settings />
        </Suspense>
      </div>
    </header>
  );
}
