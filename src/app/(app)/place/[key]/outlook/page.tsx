import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfidencePanel } from "@/components/place/confidence-panel";
import { DailyList } from "@/components/place/daily-list";
import { OutlookDaily } from "@/components/place/outlook-daily";
import { PlaceNav } from "@/components/place/place-nav";
import { SubpageHeader } from "@/components/place/subpage-header";
import { SectionCard } from "@/components/shared/section-card";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { OutlookSkeleton, RowsSkeleton } from "@/components/shared/skeletons";
import { getI18n } from "@/lib/i18n/server";
import { getForecast } from "@/lib/open-meteo/forecast";
import { getPreferences } from "@/lib/preferences";
import { lookupPlace, resolvePlace } from "@/lib/resolve-place";

export async function generateMetadata({
  params,
}: PageProps<"/place/[key]/outlook">): Promise<Metadata> {
  const { key } = await params;
  const place = await lookupPlace(key);
  return { title: place ? `${place.name} 14-Day Outlook` : "Location Not Found" };
}

async function OutlookRoute({ params }: Pick<PageProps<"/place/[key]/outlook">, "params">) {
  const { key } = await params;
  const [place, preferences, { t }] = await Promise.all([
    resolvePlace(key, "/outlook"),
    getPreferences(),
    getI18n(),
  ]);
  const text = t.place.outlook;
  const { units } = preferences;
  const forecast = await getForecast(place.latitude, place.longitude);

  return (
    <div className="flex flex-col gap-6 fit:gap-3">
      <SubpageHeader label={text.label} place={place} lead={text.lead} />

      <div className="contents fit:grid fit:grid-cols-12 fit:gap-3">
        <SectionCard id="daily" title={text.daily} className="fit:col-span-5">
          {/* The list renders immediately; the model-agreement column joins it when that fetch lands. */}
          <Suspense fallback={<DailyList forecast={forecast} units={units} />}>
            <OutlookDaily forecast={forecast} units={units} />
          </Suspense>
        </SectionCard>

        <SectionCard
          id="confidence"
          title={text.confidence}
          className="fit:col-span-7"
          bodyClassName="fit:flex fit:flex-col fit:space-y-0"
        >
          <SectionBoundary title={text.confidence}>
            <Suspense fallback={<RowsSkeleton rows={3} />}>
              <ConfidencePanel
                latitude={forecast.latitude}
                longitude={forecast.longitude}
                units={units}
                today={forecast.daily[0].date}
              />
            </Suspense>
          </SectionBoundary>
        </SectionCard>
      </div>
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
    <main
      data-wide
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 py-8 fit:pt-3 fit:pb-3"
    >
      <div className="flex flex-col gap-6 fit:gap-2">
        <Suspense fallback={null}>
          <Nav params={props.params} />
        </Suspense>
        <Suspense fallback={<OutlookSkeleton />}>
          <OutlookRoute params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}
