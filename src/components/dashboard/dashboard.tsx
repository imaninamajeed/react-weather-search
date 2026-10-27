import { IconArrowRight } from "@tabler/icons-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AlertsOverview } from "./alerts-overview";
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
import { OpenSearchButton } from "./open-search-button";

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
                <IconArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        }
      />
      <HourStrip forecast={forecast} units={units} />
    </div>
  );
}

/** Home is the only place followed: nothing to compare yet, so say how to add more. */
function OnlyHome() {
  return (
    <div className="rounded-lg border border-dashed border-border p-6">
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
    <div className="space-y-10">
      <h1 className="sr-only">Dashboard</h1>

      <SectionBoundary title="Your home forecast">
        <Suspense fallback={<HeroSkeleton />}>
          <HomeHero place={home} units={units} />
        </Suspense>
      </SectionBoundary>

      <Section id="alerts" title="Alerts">
        <SectionBoundary title="Alerts">
          <Suspense fallback={<RowsSkeleton rows={1} />}>
            <AlertsOverview places={followed} units={units} />
          </Suspense>
        </SectionBoundary>
      </Section>

      <Section
        id="places"
        title="Your places"
        aside={
          places.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/places">
                Manage and compare
                <IconArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )
        }
      >
        {places.length === 0 ? (
          <Onboarding />
        ) : others.length === 0 ? (
          <OnlyHome />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((place) => (
              <li key={place.key}>
                <PlaceCard place={place} units={units} isHome={false} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
