import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { PlaceSkeleton } from "@/components/shared/skeletons";

export default function Home(props: PageProps<"/">) {
  return (
    <main data-fit id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 pb-8 fit:pb-3">
      <Suspense fallback={<PlaceSkeleton />}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
