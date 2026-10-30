import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Text } from "@/lib/i18n/text";

export default function DashboardCrumbs() {
  return <PageBreadcrumb trail={[{ label: <Text id="nav.dashboard" /> }]} />;
}
