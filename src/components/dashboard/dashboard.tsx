import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DISMISSED_COOKIE } from "@/lib/alerts/dismissed";
import { getForecast } from "@/lib/open-meteo/forecast";
import type { Place } from "@/lib/places";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import type { Units } from "@/lib/weather/types";
import { AddPlaceTile } from "./add-place-tile";
import { AlertsOverview } from "./alerts-overview";
import { DashboardHero } from "./dashboard-hero";
import { Onboarding } from "./onboarding";
import { PlacesGrid } from "./places-grid";

// getForecast is cached, so the hero, the insights and the chart share one upstream call while
// each streams in (and can fail) on its own.
async function Hero({ place, units }: { place: Place; units: Units }) {
  const forecast = await getForecast(place.latitude, place.longitude);
  return (
    <DashboardHero
      place={{ ...place, timezone: place.timezone ?? forecast.timezone }}
      forecast={forecast}
      units={units}
    />
  );
}

function HeroSkeleton() {
  return <Skeleton aria-hidden="true" className="h-[28rem] w-full rounded-4xl lg:h-[26rem]" />;
}

function TilesSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3"
    >
      {[0, 1].map((tile) => (
        <li key={tile}>
          <Skeleton className="h-80 w-full rounded-3xl" />
        </li>
      ))}
    </ul>
  );
}

/** Staggers a section's arrival; position only, and not at all with reduced motion. */
const rise = (index: number) => ({ "--i": index }) as CSSProperties;

/**
 * The personalised landing page, built to be read top to bottom in one pass: anything you need to
 * know across your places, home right now, then the other places you follow. Managing
 * and comparing places lives on /places.
 */
export async function Dashboard({ searchParams }: { searchParams: Promise<{ manage?: string }> }) {
  const [preferences, params] = await Promise.all([getPreferences(), searchParams]);
  // Manage mode used to be a dashboard query; it is a page of its own now.
  if (params.manage) redirect("/places");

  const { units, places } = preferences;
  const home = homePlace(preferences);
  // The home place is the hero above, so it isn't repeated as a tile.
  const others = places.filter((place) => place.key !== home.key);
  const followed = [home, ...others];
  // The alerts you closed and haven't changed since: no banner, so no placeholder for it either.
  const dismissed = (await cookies()).get(DISMISSED_COOKIE)?.value;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Dashboard</h1>

      <div className="rise" style={rise(0)}>
        <SectionBoundary title="Alerts">
          <Suspense
            fallback={
              dismissed ? null : <Skeleton aria-hidden="true" className="h-13 w-full rounded-3xl" />
            }
          >
            <AlertsOverview places={followed} units={units} dismissed={dismissed} />
          </Suspense>
        </SectionBoundary>
      </div>

      <div className="rise" style={rise(1)}>
        <SectionBoundary title="Your home forecast">
          <Suspense fallback={<HeroSkeleton />}>
            <Hero place={home} units={units} />
          </Suspense>
        </SectionBoundary>
      </div>

      <div className="rise" style={rise(2)}>
        <SectionCard
          id="places"
          keepPadding
          // Darker than a normal card by night, so the near-black tiles still read as tiles on it.
          cardClassName="dark:bg-[color-mix(in_oklab,var(--card),black_22%)]"
          title="Your Places"
          description="Open any place for its full forecast"
          aside={
            places.length > 0 ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/places">
                  Manage and Compare
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : undefined
          }
        >
          {places.length === 0 ? (
            <Onboarding />
          ) : others.length === 0 ? (
            // Nothing to compare yet, so the way to add a place stands alone, full width.
            <AddPlaceTile description="Your home place is the only one you follow so far. Add another to see its conditions here." />
          ) : (
            <Suspense fallback={<TilesSkeleton />}>
              <PlacesGrid places={others} units={units} />
            </Suspense>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
