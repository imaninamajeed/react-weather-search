import {
  addDays,
  addHours,
  formatDayMonth,
  formatHour,
  formatHourRange,
  formatTime,
  formatWeekday,
} from "@/lib/format";
import { formatPrecipitation, formatSnowfall, formatSpeed, formatTemperature } from "@/lib/units";
import { aqiCategory } from "@/lib/weather/aqi";
import type { Units } from "@/lib/weather/types";
import type { ForecastHazard, OfficialAlert, WeatherAlert } from "./types";

/** "Today", "Tomorrow", otherwise "Wed Oct 28". Dates are naive local; `today` is the place's current date. */
export function relativeDay(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  return `${formatWeekday(date)} ${formatDayMonth(date)}`;
}

/** "Today 3–6 PM" or "Today 11 PM – Wed Oct 28 2 AM" for a run of whole hours (end hour inclusive). */
function hourWindow(start: string, end: string, today: string): string {
  const startDay = start.slice(0, 10);
  const endsAt = addHours(end, 1);
  if (startDay === end.slice(0, 10))
    return `${relativeDay(startDay, today)} ${formatHourRange(start, end)}`;
  return `${relativeDay(startDay, today)} ${formatHour(start)} – ${relativeDay(endsAt.slice(0, 10), today)} ${formatHour(endsAt)}`;
}

function dayWindow(start: string, end: string, today: string): string {
  return start === end
    ? relativeDay(start, today)
    : `${relativeDay(start, today)} – ${relativeDay(end, today)}`;
}

export interface AlertDescription {
  title: string;
  detail?: string;
  when: string;
}

const TITLES: Record<ForecastHazard["kind"], { advisory: string; warning: string }> = {
  thunderstorm: { advisory: "Thunderstorms", warning: "Severe Thunderstorms with Hail" },
  rain: { advisory: "Heavy Rain", warning: "Very Heavy Rain" },
  wind: { advisory: "Strong Gusts", warning: "Damaging Gusts" },
  heat: { advisory: "Hot Spell", warning: "Heat Wave" },
  frost: { advisory: "Frost", warning: "Hard Freeze" },
  snow: { advisory: "Heavy Snow", warning: "Very Heavy Snow" },
  "air-quality": { advisory: "Unhealthy Air", warning: "Very Unhealthy Air" },
};

function hazardDetail(hazard: ForecastHazard, units: Units): string {
  const { peak } = hazard;
  switch (hazard.metric) {
    case "probability":
      return `Up to ${Math.round(peak)}% chance of rain.`;
    case "rate":
      return `Up to ${formatPrecipitation(peak, units)} an hour.`;
    case "total":
      return `Around ${formatPrecipitation(peak, units)} expected over the day.`;
    case "gust":
      return `Gusts up to ${formatSpeed(peak, units)}.`;
    case "max-temp": {
      const days =
        Math.round(
          (Date.parse(`${hazard.end}T00:00Z`) - Date.parse(`${hazard.start}T00:00Z`)) / 86_400_000,
        ) + 1;
      return `Highs up to ${formatTemperature(peak, units)} for ${days} days.`;
    }
    case "min-temp":
      return `Lows down to ${formatTemperature(peak, units)}.`;
    case "snowfall":
      return `Up to ${formatSnowfall(peak, units)} expected in a day.`;
    case "aqi":
      return `US AQI ${Math.round(peak)} (${aqiCategory(peak).label}).`;
  }
}

export function describeHazard(
  hazard: ForecastHazard,
  units: Units,
  today: string,
): AlertDescription {
  const when =
    hazard.kind === "air-quality"
      ? "Right now"
      : hazard.granularity === "hour"
        ? hourWindow(hazard.start, hazard.end, today)
        : dayWindow(hazard.start, hazard.end, today);
  return {
    title: TITLES[hazard.kind][hazard.severity],
    detail: hazardDetail(hazard, units),
    when,
  };
}

/** "Until 5:00 AM today", "Until 2:00 AM Thu Oct 29", or a "from – to" window for an upcoming alert. */
export function describeOfficialWhen(alert: OfficialAlert, now: string, today: string): string {
  const { starts, ends } = alert;
  const stamp = (iso: string) => `${relativeDay(iso.slice(0, 10), today)} ${formatTime(iso)}`;
  if (ends && (!starts || starts <= now)) {
    const day = relativeDay(ends.slice(0, 10), today);
    // "5:00 AM today" / "8:00 AM tomorrow" read naturally; a named date goes after the time too.
    return `Until ${formatTime(ends)} ${day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day}`;
  }
  if (starts && ends) return `${stamp(starts)} – ${stamp(ends)}`;
  if (starts) return `From ${stamp(starts)}`;
  return "Active now";
}

export function describeAlert(alert: WeatherAlert, units: Units, now: string): AlertDescription {
  const today = now.slice(0, 10);
  if (alert.source === "forecast") return describeHazard(alert, units, today);
  return { title: alert.title, when: describeOfficialWhen(alert, now, today) };
}

const SEVERITY_RANK = { warning: 0, advisory: 1 } as const;

const startOf = (alert: WeatherAlert) =>
  alert.source === "forecast" ? alert.start : (alert.starts ?? "");

/** Official warnings first, then by severity, then by start time. */
export function compareAlerts(a: WeatherAlert, b: WeatherAlert): number {
  return (
    Number(a.source === "forecast") - Number(b.source === "forecast") ||
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    startOf(a).localeCompare(startOf(b))
  );
}

export function sortAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  return [...alerts].sort(compareAlerts);
}

export function highestSeverity(alerts: WeatherAlert[]) {
  return alerts.some((alert) => alert.severity === "warning")
    ? "warning"
    : alerts.length
      ? "advisory"
      : null;
}
