import { Suspense } from "react";
import { SectionCard } from "@/components/shared/section-card";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { RowsSkeleton } from "@/components/shared/skeletons";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { OpenSearchButton } from "./open-search-button";
import { Onboarding } from "./onboarding";
import { PlaceCard } from "./place-card";
import { SortablePlaces } from "./sortable-places";
import { WeekAheadTable } from "./week-ahead-table";

/**
 * Everything about the list of places you follow: manage it (reorder, set home, remove) and compare
 * it (a week ahead for all of them at once). Management controls are always on here, so it needs no "manage mode".
 */
export async function PlacesView() {
  const { units, places, ...rest } = await getPreferences();
  const home = homePlace({ units, places, ...rest });
  // Home leads the comparison even when it is the default city and not saved.
  const compared = [home, ...places.filter((place) => place.key !== home.key)];

  return (
    <div className="flex flex-col gap-6 fit:grid fit:grid-cols-12 fit:gap-3">
      <SectionCard
        id="places"
        title="Following"
        className="fit:col-span-6"
        aside={<OpenSearchButton label="Add a Location" variant="outline" size="sm" />}
      >
        {places.length === 0 ? (
          <Onboarding />
        ) : (
          <SortablePlaces
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 fit:grid-cols-2"
            items={places.map((place, index) => ({
              key: place.key,
              name: place.name,
              node: (
                <PlaceCard
                  place={place}
                  units={units}
                  isHome={place.key === home.key}
                  manage={{ isFirst: index === 0, isLast: index === places.length - 1 }}
                />
              ),
            }))}
          />
        )}
      </SectionCard>

      {places.length > 0 && (
        <SectionCard id="week" title="Week Ahead" className="fit:col-span-6">
          <SectionBoundary title="The week-ahead table">
            <Suspense fallback={<RowsSkeleton rows={Math.min(compared.length, 5)} />}>
              <WeekAheadTable places={compared} units={units} />
            </Suspense>
          </SectionBoundary>
        </SectionCard>
      )}
    </div>
  );
}
