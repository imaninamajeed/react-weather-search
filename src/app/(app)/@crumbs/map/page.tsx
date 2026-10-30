import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Text } from "@/lib/i18n/text";

export default function Crumbs() {
  return (
    <PageBreadcrumb
      trail={[
        { label: <Text id="nav.dashboard" />, href: "/dashboard" },
        { label: <Text id="nav.radarMap" /> },
      ]}
    />
  );
}
