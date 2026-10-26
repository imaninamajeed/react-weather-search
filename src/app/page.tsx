import { Suspense } from "react";
import { PlaceView } from "@/components/place/place-view";
import { PlaceSkeleton } from "@/components/shared/skeletons";
import { DEFAULT_PLACE } from "@/lib/places";
import { DEFAULT_UNITS } from "@/lib/units";

// Becomes the personalised dashboard once saved places exist; until then it shows the default city.
export default function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<PlaceSkeleton />}>
        <PlaceView place={DEFAULT_PLACE} units={DEFAULT_UNITS} />
      </Suspense>
    </main>
  );
}
