import { Suspense } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { PlaceCrumbs } from "@/components/place/place-crumbs";

export default function Crumbs(props: PageProps<"/place/[key]/history">) {
  return (
    // Until the place resolves, show the levels that are known.
    <Suspense
      fallback={
        <PageBreadcrumb
          trail={[
            { label: "Dashboard", href: "/" },
            { label: "Places", href: "/places" },
          ]}
        />
      }
    >
      <PlaceCrumbs params={props.params} view="Climate" />
    </Suspense>
  );
}
