import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { PlaceSkeleton } from "@/components/shared/skeletons";

export default function Home(props: PageProps<"/dashboard">) {
  return (
    <main
      data-wide
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 pt-2 pb-6 md:pt-4"
    >
      <Suspense fallback={<PlaceSkeleton />}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
