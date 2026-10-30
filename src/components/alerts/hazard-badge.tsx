import { OctagonAlert, TriangleAlert } from "lucide-react";
import { highestSeverity } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import { Badge } from "@/components/ui/badge";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/** A compact "2 alerts" chip for place cards; nothing when there are none. */
export async function HazardBadge({ alerts }: { alerts: WeatherAlert[] }) {
  const { t } = await getI18n();
  const severity = highestSeverity(alerts);
  if (!severity) return null;
  const Icon = severity === "warning" ? OctagonAlert : TriangleAlert;
  const label =
    alerts.length === 1
      ? severity === "warning"
        ? t.alerts.badge.oneWarning
        : t.alerts.badge.oneAdvisory
      : t.alerts.badge.many(alerts.length);

  return (
    <Badge
      className={cn(
        "gap-1",
        severity === "warning"
          ? "bg-warning text-warning-foreground"
          : "bg-advisory text-advisory-foreground",
      )}
    >
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}
