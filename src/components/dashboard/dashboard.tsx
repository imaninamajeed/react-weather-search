import { IconArrowRight } from "@tabler/icons-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { HeroSkeleton, RowsSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getForecast } from "@/lib/open-meteo/forecast";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";
import type { Place } from "@/lib/places";
import type { Units } from "@/lib/weather/types";
import { AlertsOverview } from "./alerts-overview";
import { DayChart } from "./day-chart";
import { HomeHero } from "./home-hero";
import { Onboarding } from "./onboarding";
import { OpenSearchButton } from "./open-search-button";
import { PlaceCard } from "./place-card";
import { StatCards } from "./stat-cards";

// getForecast is cached, so the hero, the stat cards and the chart share one upstream call while
// each streams in (and can fail) on its own.
async function Hero({ place, units }: { place: Place; units: Units }) {
  const forecast = await getForecast(place.latitude, place.longitude);
  return (
    <HomeHero
      place={{ ...place, timezone: place.timezone ?? forecast.timezone }}
      forecast={forecast}
      units={units}
    />
  );
}

async function Stats({ place, units }: { place: Place; units: Units }) {
  const forecast = await getForecast(place.latitude, place.longitude);
  return <StatCards forecast={forecast} units={units} />;
}

async function DayChartCard({ place, units }: { place: Place; units: Units }) {
  const forecast = await getForecast(place.latitude, place.longitude);
  return <DayChart hours={forecast.hourly.slice(0, 24)} units={units} />;
}

function StatsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-40 rounded-4xl" />
      ))}
    </div>
  );
}

/** Home is the only place followed: nothing to compare yet, so say how to add more. */
function OnlyHome() {
  return (
    <div className="rounded-3xl border border-dashed border-border p-6">
      <p className="text-muted-foreground">
        Your home place is the only one you follow so far. Add another to see its conditions here.
      </p>
      <div className="mt-4">
        <OpenSearchButton label="Add a place" variant="outline" />
      </div>
    </div>
  );
}

/**
 * The personalised landing page, built to be read in one glance: home now, anything you need to know,
 * and the status of the other places you follow. Managing and comparing places lives on /places.
 */
export async function Dashboard({ searchParams }: { searchParams: Promise<{ manage?: string }> }) {
  const [preferences, params] = await Promise.all([getPreferences(), searchParams]);
  // Manage mode used to be a dashboard query; it is a page of its own now.
  if (params.manage) redirect("/places");

  const { units, places } = preferences;
  const home = homePlace(preferences);
  // The home place is the hero above, so it isn't repeated as a card.
  const others = places.filter((place) => place.key !== home.key);
  const followed = [home, ...others];

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Dashboard</h1>

      <SectionBoundary title="Your home forecast">
        <Suspense fallback={<HeroSkeleton />}>
          <Hero place={home} units={units} />
        </Suspense>
      </SectionBoundary>

      <SectionBoundary title="Today's conditions">
        <Suspense fallback={<StatsSkeleton />}>
          <Stats place={home} units={units} />
        </Suspense>
      </SectionBoundary>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-xl">Next 24 hours</CardTitle>
            <CardDescription>
              Temperature in {home.name}, with the chance of rain beneath
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SectionBoundary title="The 24-hour chart">
              <Suspense fallback={<Skeleton aria-hidden="true" className="h-72 w-full" />}>
                <DayChartCard place={home} units={units} />
              </Suspense>
            </SectionBoundary>
          </CardContent>
        </Card>

        <section aria-labelledby="alerts-title" className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle id="alerts-title" role="heading" aria-level={2} className="text-xl">
                Alerts
              </CardTitle>
              <CardDescription>
                Across {followed.length === 1 ? "your place" : `your ${followed.length} places`}
              </CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href="/alerts">
                    All alerts
                    <IconArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <SectionBoundary title="Alerts">
                <Suspense fallback={<RowsSkeleton rows={1} />}>
                  <AlertsOverview places={followed} units={units} />
                </Suspense>
              </SectionBoundary>
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="places-title" className="space-y-4 pt-6">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 id="places-title" className="font-heading text-3xl leading-none">
            Your places
          </h2>
          {places.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/places">
                Manage and compare
                <IconArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
        </header>
        {places.length === 0 ? (
          <Onboarding />
        ) : others.length === 0 ? (
          <OnlyHome />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((place) => (
              <li key={place.key}>
                <PlaceCard place={place} units={units} isHome={false} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
