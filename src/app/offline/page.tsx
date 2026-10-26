import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Offline" };

/** Precached by the service worker and shown when a page that was never visited can't be fetched. */
export default function OfflinePage() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24"
    >
      <WifiOff aria-hidden="true" className="size-8 text-muted-foreground" />
      <p className="label-caps">No connection</p>
      <h1 className="font-display text-5xl md:text-6xl">You&apos;re offline</h1>
      <p className="max-w-prose text-muted-foreground">
        This page hasn&apos;t been opened on this device yet, so there&apos;s nothing saved to show.
        Places you&apos;ve already viewed still work offline, with the forecast from the last time
        you loaded them.
      </p>
      <Button asChild>
        <Link href="/">Back to your dashboard</Link>
      </Button>
    </main>
  );
}
