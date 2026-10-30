import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryStats } from "@/components/history/history-stats";
import { DailyHighsChart, MonthlyRainChart } from "@/components/history/history-charts";
import { HistoryTables } from "@/components/history/history-tables";
import { PlaceNav } from "@/components/place/place-nav";
import { SubpageHeader } from "@/components/place/subpage-header";
import { SectionCard } from "@/components/shared/section-card";
import { HistorySkeleton } from "@/components/shared/skeletons";
import { getI18n } from "@/lib/i18n/server";
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
  return { title: place ? `${place.name} Climate History` : "Location Not Found" };
}

async function HistoryRoute({ params }: Pick<PageProps<"/place/[key]/history">, "params">) {
  const { key } = await params;
  const [place, preferences, { t }] = await Promise.all([
    resolvePlace(key, "/history"),
    getPreferences(),
    getI18n(),
  ]);
  const text = t.place.history;
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
    <div className="flex flex-col gap-6 fit:gap-3">
      <SubpageHeader label={text.label} place={place} lead={text.lead} />

      <SectionCard id="summary" title={text.summary} quietTitleAtFit>
        <HistoryStats summary={summary} units={units} />
      </SectionCard>

      <div className="contents fit:grid fit:grid-cols-12 fit:gap-3">
        <SectionCard id="highs" title={text.highs} className="fit:col-span-7">
          <DailyHighsChart days={days} units={units} />
        </SectionCard>

        <SectionCard
          id="rain"
          title={text.rain}
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
        {text.source}
      </p>
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
      data-wide
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 py-8 fit:pt-3 fit:pb-3"
    >
      <div className="flex flex-col gap-6 fit:gap-2">
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
