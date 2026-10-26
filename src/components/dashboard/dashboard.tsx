import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PlaceHero } from "@/components/place/hero";
import { Section } from "@/components/shared/section";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { HeroSkeleton, RowsSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getForecast } from "@/lib/open-meteo/forecast";
import { placeHref, type Place } from "@/lib/places";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import type { Units } from "@/lib/weather/types";
import { HourStrip } from "./hour-strip";
import { Onboarding } from "./onboarding";
import { PlaceCard } from "./place-card";
import { WeekAheadTable } from "./week-ahead-table";

async function HomeHero({ place, units }: { place: Place; units: Units }) {
  const forecast = await getForecast(place.latitude, place.longitude);
  return (
    <div className="space-y-3">
      <PlaceHero
        place={{ ...place, timezone: place.timezone ?? forecast.timezone }}
        forecast={forecast}
        units={units}
        headingLevel={2}
        actions={
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">Home</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={placeHref(place)}>
                Full forecast
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        }
      />
      <HourStrip forecast={forecast} units={units} />
    </div>
  );
}

/** The personalised landing page: home forecast, saved places and a week-ahead comparison. */
export async function Dashboard({ searchParams }: { searchParams: Promise<{ manage?: string }> }) {
  const [preferences, params] = await Promise.all([getPreferences(), searchParams]);
  const { units, places } = preferences;
  const home = homePlace(preferences);
  const managing = params.manage === "1" && places.length > 0;
  // Home leads the week-ahead table even when it is the default city and not saved.
  const weekPlaces = [home, ...places.filter((place) => place.key !== home.key)];

  return (
    <div className="space-y-10">
      <h1 className="sr-only">Dashboard</h1>

      <SectionBoundary title="Your home forecast">
        <Suspense fallback={<HeroSkeleton />}>
          <HomeHero place={home} units={units} />
        </Suspense>
      </SectionBoundary>

      <Section
        id="places"
        title="Your places"
        aside={
          places.length > 0 && (
            <Button asChild variant={managing ? "default" : "outline"} size="sm">
              <Link href={managing ? "/" : "/?manage=1"} scroll={false}>
                {managing ? "Done" : "Manage"}
              </Link>
            </Button>
          )
        }
      >
        {places.length === 0 ? (
          <Onboarding />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((place, index) => (
              <li key={place.key}>
                <PlaceCard
                  place={place}
                  units={units}
                  isHome={place.key === home.key}
                  manage={
                    managing
                      ? { isFirst: index === 0, isLast: index === places.length - 1 }
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {places.length > 0 && (
        <Section id="week" title="Week ahead">
          <SectionBoundary title="The week-ahead table">
            <Suspense fallback={<RowsSkeleton rows={Math.min(weekPlaces.length, 5)} />}>
              <WeekAheadTable places={weekPlaces} units={units} />
            </Suspense>
          </SectionBoundary>
        </Section>
      )}
    </div>
  );
}
