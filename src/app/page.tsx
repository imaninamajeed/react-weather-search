import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { PlaceSkeleton } from "@/components/shared/skeletons";

export default function Home(props: PageProps<"/">) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<PlaceSkeleton />}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
