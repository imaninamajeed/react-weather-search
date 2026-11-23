import { highestSeverity } from "./describe";
import type { AlertSeverity, WeatherAlert } from "./types";

/**
 * The most serious alert in force on one calendar day ("YYYY-MM-DD" at the place), or null. An
 * official alert with no start has already begun (`today`); one with no end is counted for its
 * first day only, since nothing says how long it lasts.
 */
export function severityOnDay(
  alerts: WeatherAlert[],
  day: string,
  today: string,
): AlertSeverity | null {
  return highestSeverity(
    alerts.filter((alert) => {
      const [from, to] =
        alert.source === "forecast" ? [alert.start, alert.end] : [alert.starts, alert.ends];
      const first = from?.slice(0, 10) ?? today;
      const last = to?.slice(0, 10) ?? first;
      return first <= day && day <= last;
    }),
  );
}
