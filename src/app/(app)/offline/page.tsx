import type { Metadata } from "next";
import { OfflineState } from "@/components/shared/state-pages";

export const metadata: Metadata = { title: "Offline" };

/** Precached by the service worker and shown when a page that was never visited can't be fetched. */
export default function OfflinePage() {
  return <OfflineState />;
}
