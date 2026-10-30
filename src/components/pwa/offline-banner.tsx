"use client";

import { IconWifiOff } from "@tabler/icons-react";
import { useOnlineStatus } from "./use-online-status";

/**
 * Says plainly what still works offline. The forecast on screen carries its own "as of" time
 * (the local-time line in each hero), so it is never mistaken for live data.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="status" className="border-b border-border bg-advisory/20">
      <p className="mx-auto flex w-full max-w-(--page-max) items-center gap-2 px-4 py-2 text-sm">
        <IconWifiOff aria-hidden="true" className="size-4 shrink-0" />
        You&apos;re offline. Showing what was last loaded on this device; search, saving places and
        live radar need a connection.
      </p>
    </div>
  );
}
