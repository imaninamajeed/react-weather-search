import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertsView } from "@/components/alerts/alerts-view";
import { PageHeader } from "@/components/shared/page-header";
import { RowsSkeleton } from "@/components/shared/skeletons";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";

export const metadata: Metadata = {
  title: "Alerts",
  description: "Official warnings and forecast signals for every place you follow.",
};

async function AlertsContent({ searchParams }: Pick<PageProps<"/alerts">, "searchParams">) {
  const [preferences, params] = await Promise.all([getPreferences(), searchParams]);
  const home = homePlace(preferences);
  const places = [home, ...preferences.places.filter((place) => place.key !== home.key)];

  return (
    <AlertsView
      places={places}
      units={preferences.units}
      officialOnly={params.show === "official"}
    />
  );
}

export default function AlertsPage(props: PageProps<"/alerts">) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="space-y-6">
        <PageHeader
          label="Stay safe"
          title="Alerts"
          lead="Official warnings first, then signals from the forecast, for every place you follow."
        />
        <Suspense fallback={<RowsSkeleton rows={3} />}>
          <AlertsContent searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
