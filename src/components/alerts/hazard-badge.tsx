import { OctagonAlert, TriangleAlert } from "lucide-react";
import { highestSeverity } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** A compact "2 alerts" chip for place cards; nothing when there are none. */
export function HazardBadge({ alerts }: { alerts: WeatherAlert[] }) {
  const severity = highestSeverity(alerts);
  if (!severity) return null;
  const Icon = severity === "warning" ? OctagonAlert : TriangleAlert;
  const label =
    alerts.length === 1
      ? `1 ${severity === "warning" ? "Warning" : "Advisory"}`
      : `${alerts.length} Alerts`;

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
