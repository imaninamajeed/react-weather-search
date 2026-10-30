import type { Metadata } from "next";
import Link from "next/link";
import { IconWifiOff } from "@tabler/icons-react";
import { StateScreen } from "@/components/shared/state-screen";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Offline" };

/** Precached by the service worker and shown when a page that was never visited can't be fetched. */
export default function OfflinePage() {
  return (
    <StateScreen
      icon={IconWifiOff}
      label="No connection"
      title="You're offline"
      actions={
        <Button asChild>
          <Link href="/dashboard">Back to Your Dashboard</Link>
        </Button>
      }
    >
      <p>
        This page hasn&apos;t been opened on this device yet, so there&apos;s nothing saved to show.
        Places you&apos;ve already viewed still work offline, with the forecast from the last time
        you loaded them.
      </p>
    </StateScreen>
  );
}
