import { Suspense } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Text } from "@/lib/i18n/text";
import { PlaceCrumbs } from "@/components/place/place-crumbs";

export default function Crumbs(props: PageProps<"/place/[key]">) {
  return (
    // Until the place resolves, show the levels that are known.
    <Suspense
      fallback={
        <PageBreadcrumb
          trail={[
            { label: <Text id="nav.dashboard" />, href: "/dashboard" },
            { label: <Text id="nav.locations" />, href: "/places" },
          ]}
        />
      }
    >
      <PlaceCrumbs params={props.params} view="forecast" />
    </Suspense>
  );
}
