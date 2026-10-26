import type { WeatherAlert } from "@/lib/alerts/types";
import type { Units } from "@/lib/weather/types";
import { AlertItem } from "./alert-item";

interface AlertListProps {
  /** Already sorted, most important first. */
  alerts: WeatherAlert[];
  units: Units;
  now: string;
  /** Alerts shown before the rest fold into "Show N more". */
  limit?: number;
}

/** The most important alerts up front; the long tail is one click away rather than a wall of cards. */
export function AlertList({ alerts, units, now, limit = 4 }: AlertListProps) {
  const shown = alerts.slice(0, limit);
  const rest = alerts.slice(limit);

  return (
    <>
      <ul className="space-y-3">
        {shown.map((alert) => (
          <AlertItem key={alert.id} alert={alert} units={units} now={now} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium select-none">
            Show {rest.length} more {rest.length === 1 ? "alert" : "alerts"}
          </summary>
          <ul className="mt-3 space-y-3">
            {rest.map((alert) => (
              <AlertItem key={alert.id} alert={alert} units={units} now={now} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
