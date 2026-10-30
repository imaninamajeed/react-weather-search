import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaceNav } from "@/components/place/place-nav";
import { PlaceActions } from "@/components/place/place-actions";
import { PlaceView } from "@/components/place/place-view";
import { PlaceSkeleton } from "@/components/shared/skeletons";
import { getPreferences } from "@/lib/preferences";
import { isSaved } from "@/lib/preferences-core";
import { lookupPlace, resolvePlace } from "@/lib/resolve-place";

export async function generateMetadata({ params }: PageProps<"/place/[key]">): Promise<Metadata> {
  const { key } = await params;
  const place = await lookupPlace(key);
  if (!place) return { title: "Place not found" };
  return {
    title: `${place.name} weather`,
    description: `Forecast, alerts and conditions for ${place.name}${place.country ? `, ${place.country}` : ""}.`,
  };
}

async function PlaceRoute({ params }: Pick<PageProps<"/place/[key]">, "params">) {
  // Awaiting params inside <Suspense> lets Next.js serve the shell instantly for any place.
  const { key } = await params;
  const [place, preferences] = await Promise.all([resolvePlace(key), getPreferences()]);

  return (
    <div className="flex flex-col gap-4 fit:min-h-0 fit:flex-1 fit:gap-2">
      <PlaceNav placeKey={place.key} current="forecast" />
      <PlaceView
        place={place}
        units={preferences.units}
        actions={
          <PlaceActions
            placeKey={place.key}
            placeName={place.name}
            saved={isSaved(preferences, place.key)}
            isHome={preferences.homeKey === place.key}
          />
        }
      />
    </div>
  );
}

export default function PlacePage(props: PageProps<"/place/[key]">) {
  return (
    <main data-fit id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 pb-8 fit:pb-3">
      <Suspense fallback={<PlaceSkeleton />}>
        <PlaceRoute params={props.params} />
      </Suspense>
    </main>
  );
}
