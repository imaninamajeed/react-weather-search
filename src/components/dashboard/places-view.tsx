import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import { Onboarding } from "./onboarding";
import { OpenSearchButton } from "./open-search-button";
import { HomeCard } from "./home-card";
import { PlacesTabs } from "./places-tabs";
import { SavedGrid } from "./saved-grid";
import { SavedLayoutMenu } from "./saved-layout-menu";
import { SavedTile, TILE_SHAPE } from "./saved-tile";

/**
 * The locations you follow, as two tabs in the Alerts page's calm layout: Home, a hero card for the one
 * location the dashboard leads with, and Saved Locations, the others as square tiles you can reorder and open for their seven days.
 * Management (reorder, set home, remove) is always on, in each card's menu, so there is no
 * "manage mode". Home is not in the reorderable list, so nothing can be dropped above it.
 */
export async function PlacesView() {
  const [{ units, places, ...rest }, { t }] = await Promise.all([getPreferences(), getI18n()]);
  const text = t.dashboard.view;
  const home = homePlace({ units, places, ...rest });
  const homeSaved = places.some((place) => place.key === home.key);
  const others = places.filter((place) => place.key !== home.key);

  return (
    <PlacesTabs
      homeLabel={text.homeTab}
      savedLabel={text.savedTab}
      savedCount={others.length}
      savedAction={others.length > 1 ? <SavedLayoutMenu /> : null}
      action={<OpenSearchButton label={text.addLocation} variant="outline" size="sm" />}
      home={
        // A home that is only the default city is not saved, so it has nothing to reorder or remove.
        <Suspense
          fallback={<Skeleton aria-hidden="true" className="h-[30rem] w-full rounded-4xl" />}
        >
          <HomeCard
            place={home}
            units={units}
            manage={homeSaved ? { isFirst: true, isLast: true } : undefined}
          />
        </Suspense>
      }
      saved={
        others.length === 0 ? (
          places.length === 0 ? (
            <Onboarding />
          ) : (
            <p className="rounded-3xl border border-dashed border-border p-6 text-muted-foreground">
              {t.dashboard.onlyHome}
            </p>
          )
        ) : (
          <div className="flex flex-col gap-4 fit:gap-3">
            <SavedGrid
              items={others.map((place, index) => ({
                key: place.key,
                name: place.name,
                node: (
                  <Suspense
                    fallback={
                      <Skeleton
                        aria-hidden="true"
                        className={cn("w-full rounded-4xl", TILE_SHAPE)}
                      />
                    }
                  >
                    <SavedTile
                      place={place}
                      units={units}
                      manage={{ isFirst: index === 0, isLast: index === others.length - 1 }}
                    />
                  </Suspense>
                ),
              }))}
            />
            <p className="px-1 text-xs text-muted-foreground">{text.note}</p>
          </div>
        )
      }
    />
  );
}
