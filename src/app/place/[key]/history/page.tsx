import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryStats } from "@/components/history/history-stats";
import { DailyHighsChart, MonthlyRainChart } from "@/components/history/history-charts";
import { HistoryTables } from "@/components/history/history-tables";
import { PlaceNav } from "@/components/place/place-nav";
import { SubpageHeader } from "@/components/place/subpage-header";
import { SectionCard } from "@/components/shared/section-card";
import { ChartSkeleton, HeroSkeleton, RowsSkeleton } from "@/components/shared/skeletons";
import { getForecast } from "@/lib/open-meteo/forecast";
import { getClimateNormals, getRecentDaily } from "@/lib/open-meteo/archive";
import { getPreferences } from "@/lib/preferences";
import { lookupPlace, resolvePlace } from "@/lib/resolve-place";
import { compareDays, compareMonths, historyWindow, summarizeHistory } from "@/lib/weather/climate";

export async function generateMetadata({
  params,
}: PageProps<"/place/[key]/history">): Promise<Metadata> {
  const { key } = await params;
  const place = await lookupPlace(key);
  return { title: place ? `${place.name} climate history` : "Place not found" };
}

async function HistoryRoute({ params }: Pick<PageProps<"/place/[key]/history">, "params">) {
  const { key } = await params;
  const [place, preferences] = await Promise.all([resolvePlace(key, "/history"), getPreferences()]);
  const { units } = preferences;

  // The place's own "today" anchors the window (the archive lags by a couple of days).
  const forecast = await getForecast(place.latitude, place.longitude);
  const { start, end } = historyWindow(forecast.daily[0].date);
  const [recent, normals] = await Promise.all([
    getRecentDaily(place.latitude, place.longitude, start, end),
    getClimateNormals(place.latitude, place.longitude),
  ]);

  const days = compareDays(recent, normals);
  const months = compareMonths(recent, normals);
  const summary = summarizeHistory(days, months);

  return (
    <div className="flex flex-col gap-6 fit:min-h-0 fit:flex-1 fit:gap-3">
      <SubpageHeader
        label="Climate"
        place={place}
        lead="The last twelve months compared with what is normal here, using 1991–2020 as the baseline."
      />

      <SectionCard id="summary" title="The year at a glance" quietTitleAtFit>
        <HistoryStats summary={summary} units={units} />
      </SectionCard>

      <div className="contents fit:grid fit:min-h-0 fit:flex-1 fit:grid-cols-12 fit:gap-3">
        <SectionCard id="highs" title="Daily highs" className="fit:col-span-7">
          <DailyHighsChart days={days} units={units} />
        </SectionCard>

        <SectionCard
          id="rain"
          title="Monthly rainfall"
          className="fit:col-span-5"
          bodyClassName="fit:flex fit:flex-col fit:gap-2 fit:space-y-0"
        >
          <MonthlyRainChart months={months} units={units} />
          <div className="mt-2 fit:mt-0">
            <HistoryTables days={days} months={months} units={units} />
          </div>
        </SectionCard>
      </div>

      <p className="border-t border-border pt-4 text-xs text-muted-foreground fit:border-0 fit:pt-0 fit:text-[0.6875rem]">
        Source: ERA5 reanalysis via Open-Meteo, on a grid of about 30 km, so values describe the
        surrounding area rather than one station. Data runs a few days behind today. The normal
        range is the middle 80% of daily highs on the same calendar day (±7 days) from 1991 to 2020.
      </p>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div role="status" aria-label="Loading climate history" className="space-y-10">
      <HeroSkeleton />
      <ChartSkeleton />
      <RowsSkeleton rows={3} />
    </div>
  );
}

async function Nav({ params }: Pick<PageProps<"/place/[key]/history">, "params">) {
  const { key } = await params;
  const place = await lookupPlace(key);
  return place ? <PlaceNav placeKey={place.key} current="history" /> : null;
}

export default function HistoryPage(props: PageProps<"/place/[key]/history">) {
  return (
    <main
      data-fit
      id="main"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 fit:py-2 fit:pb-3"
    >
      <div className="flex flex-col gap-6 fit:min-h-0 fit:flex-1 fit:gap-2">
        <Suspense fallback={null}>
          <Nav params={props.params} />
        </Suspense>
        <Suspense fallback={<HistorySkeleton />}>
          <HistoryRoute params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}
