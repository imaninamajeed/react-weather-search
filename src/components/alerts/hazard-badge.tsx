import { IconAlertOctagon, IconAlertTriangle } from "@tabler/icons-react";
import { highestSeverity } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** A compact "2 alerts" chip for place cards; nothing when there are none. */
export function HazardBadge({ alerts }: { alerts: WeatherAlert[] }) {
  const severity = highestSeverity(alerts);
  if (!severity) return null;
  const Icon = severity === "warning" ? IconAlertOctagon : IconAlertTriangle;
  const label = alerts.length === 1 ? `1 ${severity}` : `${alerts.length} alerts`;

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
