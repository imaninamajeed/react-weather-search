import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacesBanner } from "@/components/dashboard/places-banner";
import { PlacesView } from "@/components/dashboard/places-view";
import { RowsSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Places",
  description: "Manage the places you follow and compare the week ahead across all of them.",
};

/** As on the Alerts page, the banner is the page's heading: the `h1` is for assistive tech only. */
export default function PlacesPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 pt-2 pb-6 md:pt-4 fit:pb-3"
    >
      <h1 className="sr-only">Places</h1>
      <div className="flex flex-col gap-6 fit:gap-3">
        <Suspense fallback={<Skeleton aria-hidden="true" className="h-56 w-full rounded-4xl" />}>
          <PlacesBanner />
        </Suspense>
        <Suspense fallback={<RowsSkeleton rows={4} />}>
          <PlacesView />
        </Suspense>
      </div>
    </main>
  );
}
