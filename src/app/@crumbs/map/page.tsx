import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";

export default function Crumbs() {
  return <PageBreadcrumb trail={[{ label: "Dashboard", href: "/" }, { label: "Radar map" }]} />;
}
