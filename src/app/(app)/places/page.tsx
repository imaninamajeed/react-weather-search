import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacesView } from "@/components/dashboard/places-view";
import { PageHeader } from "@/components/shared/page-header";
import { RowsSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = {
  title: "Places",
  description: "Manage the places you follow and compare the week ahead across all of them.",
};

export default function PlacesPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 py-8 fit:pt-3 fit:pb-3"
    >
      <div className="space-y-10 fit:flex fit:flex-col fit:gap-3 fit:space-y-0">
        <PageHeader
          label="Manage and compare"
          title="Places"
          lead="Reorder, choose your home place, and see the week ahead for everywhere you follow."
        />
        <Suspense fallback={<RowsSkeleton rows={4} />}>
          <PlacesView />
        </Suspense>
      </div>
    </main>
  );
}
