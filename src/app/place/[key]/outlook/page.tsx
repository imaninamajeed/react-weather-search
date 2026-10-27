import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfidencePanel } from "@/components/place/confidence-panel";
import { DailyList } from "@/components/place/daily-list";
import { OutlookDaily } from "@/components/place/outlook-daily";
import { PlaceNav } from "@/components/place/place-nav";
import { SubpageHeader } from "@/components/place/subpage-header";
import { Section } from "@/components/shared/section";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { HeroSkeleton, RowsSkeleton } from "@/components/shared/skeletons";
import { getForecast } from "@/lib/open-meteo/forecast";
import { getPreferences } from "@/lib/preferences";
import { lookupPlace, resolvePlace } from "@/lib/resolve-place";

export async function generateMetadata({
  params,
}: PageProps<"/place/[key]/outlook">): Promise<Metadata> {
  const { key } = await params;
  const place = await lookupPlace(key);
  return { title: place ? `${place.name} 14-day outlook` : "Place not found" };
}

async function OutlookRoute({ params }: Pick<PageProps<"/place/[key]/outlook">, "params">) {
  const { key } = await params;
  const [place, preferences] = await Promise.all([resolvePlace(key, "/outlook"), getPreferences()]);
  const { units } = preferences;
  const forecast = await getForecast(place.latitude, place.longitude);

  return (
    <div className="space-y-10">
      <SubpageHeader
        label="Plan ahead"
        place={place}
        lead="Two weeks of daily forecasts, and how far each day can be trusted."
      />

      <Section id="daily" title="14-day outlook">
        {/* The list renders immediately; the model-agreement column joins it when that fetch lands. */}
        <Suspense fallback={<DailyList forecast={forecast} units={units} />}>
          <OutlookDaily forecast={forecast} units={units} />
        </Suspense>
      </Section>

      <Section id="confidence" title="Forecast confidence">
        <SectionBoundary title="Forecast confidence">
          <Suspense fallback={<RowsSkeleton rows={3} />}>
            <ConfidencePanel
              latitude={forecast.latitude}
              longitude={forecast.longitude}
              units={units}
              today={forecast.daily[0].date}
            />
          </Suspense>
        </SectionBoundary>
      </Section>
    </div>
  );
}

async function Nav({ params }: Pick<PageProps<"/place/[key]/outlook">, "params">) {
  const { key } = await params;
  const place = await lookupPlace(key);
  return place ? <PlaceNav placeKey={place.key} current="outlook" /> : null;
}

export default function OutlookPage(props: PageProps<"/place/[key]/outlook">) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <Nav params={props.params} />
        </Suspense>
        <Suspense
          fallback={
            <div role="status" aria-label="Loading outlook" className="space-y-10">
              <HeroSkeleton />
              <RowsSkeleton />
            </div>
          }
        >
          <OutlookRoute params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}
