import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertsView } from "@/components/alerts/alerts-view";
import { Skeleton } from "@/components/ui/skeleton";
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
      homeKey={home.key}
      units={preferences.units}
      officialOnly={params.show === "official"}
    />
  );
}

function AlertsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <Skeleton className="h-64 w-full rounded-4xl lg:h-52" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56 rounded-full" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
        <Skeleton className="hidden h-80 rounded-4xl xl:block" />
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
      <h1 className="sr-only">Alerts</h1>
      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
