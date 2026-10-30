import { Suspense } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { PlaceCrumbs } from "@/components/place/place-crumbs";

export default function Crumbs(props: PageProps<"/place/[key]/outlook">) {
  return (
    // Until the place resolves, show the levels that are known.
    <Suspense
      fallback={
        <PageBreadcrumb
          trail={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Places", href: "/places" },
          ]}
        />
      }
    >
      <PlaceCrumbs params={props.params} view="Outlook" />
    </Suspense>
  );
}
