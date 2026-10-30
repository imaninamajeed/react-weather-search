import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherAlert } from "@/lib/alerts/types";
import { getI18n } from "@/lib/i18n/server";
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
export async function AlertList({ alerts, units, now, limit = 4 }: AlertListProps) {
  const { t } = await getI18n();
  const shown = alerts.slice(0, limit);
  const rest = alerts.slice(limit);

  return (
    <>
      <ul className="divide-y divide-border *:first:pt-0 *:last:pb-0">
        {shown.map((alert) => (
          <AlertItem key={alert.id} alert={alert} units={units} now={now} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group mt-4 border-t border-border pt-4">
          <Button asChild variant="outline" size="sm">
            <summary>
              {t.alerts.list.showMore(rest.length)}
              <ChevronDown
                aria-hidden="true"
                className="transition-transform group-open:rotate-180"
              />
            </summary>
          </Button>
          <ul className="mt-2 divide-y divide-border *:last:pb-0">
            {rest.map((alert) => (
              <AlertItem key={alert.id} alert={alert} units={units} now={now} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
