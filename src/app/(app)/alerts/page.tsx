import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertsView } from "@/components/alerts/alerts-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/lib/i18n/text";
import { getPreferences } from "@/lib/preferences";
import { homePlace } from "@/lib/preferences-core";

export const metadata: Metadata = {
  title: "Alerts",
  description: "Official warnings and forecast signals for every location you follow.",
};

async function AlertsContent({ searchParams }: Pick<PageProps<"/alerts">, "searchParams">) {
  const [preferences, params] = await Promise.all([getPreferences(), searchParams]);
  const home = homePlace(preferences);
  const places = [home, ...preferences.places.filter((place) => place.key !== home.key)];

  return (
    <AlertsView
      places={places}
      homeKey={home.key}
      units={preferences.units}
      officialOnly={params.show === "official"}
    />
  );
}

function AlertsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <Skeleton className="h-44 w-full rounded-4xl" />
      <Skeleton className="mt-4 h-9 w-72 rounded-full" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))] gap-4">
        <Skeleton className="h-64 rounded-4xl" />
        <Skeleton className="h-64 rounded-4xl" />
      </div>
    </div>
  );
}

/** Like the dashboard, the summary panel is the page's heading: the `h1` is for assistive tech only. */
export default function AlertsPage(props: PageProps<"/alerts">) {
  return (
    <main
      data-wide
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 pt-2 pb-6 md:pt-4"
    >
      <h1 className="sr-only">
        <Text id="nav.alerts" />
      </h1>
      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
