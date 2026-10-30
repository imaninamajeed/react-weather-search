import {
  addDays,
  addHours,
  formatDayMonth,
  formatHour,
  formatHourRange,
  formatTime,
  formatWeekday,
} from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";
import { formatPrecipitation, formatSnowfall, formatSpeed, formatTemperature } from "@/lib/units";
import { aqiCategory } from "@/lib/weather/aqi";
import type { Units } from "@/lib/weather/types";
import type { ForecastHazard, OfficialAlert, WeatherAlert } from "./types";

/** "Today", "Tomorrow", otherwise "Wed Oct 28". Dates are naive local; `today` is the place's current date. */
export function relativeDay(date: string, today: string, locale: Locale = DEFAULT_LOCALE): string {
  const { day } = getMessages(locale).weather;
  if (date === today) return day.todayTitle;
  if (date === addDays(today, 1)) return day.tomorrowTitle;
  return `${formatWeekday(date, "short", locale)} ${formatDayMonth(date, locale)}`;
}

/** "Today 3–6 PM" or "Today 11 PM – Wed Oct 28 2 AM" for a run of whole hours (end hour inclusive). */
function hourWindow(start: string, end: string, today: string, locale: Locale): string {
  const startDay = start.slice(0, 10);
  const endsAt = addHours(end, 1);
  if (startDay === end.slice(0, 10))
    return `${relativeDay(startDay, today, locale)} ${formatHourRange(start, end, locale)}`;
  return `${relativeDay(startDay, today, locale)} ${formatHour(start, locale)} – ${relativeDay(endsAt.slice(0, 10), today, locale)} ${formatHour(endsAt, locale)}`;
}

function dayWindow(start: string, end: string, today: string, locale: Locale): string {
  return start === end
    ? relativeDay(start, today, locale)
    : `${relativeDay(start, today, locale)} – ${relativeDay(end, today, locale)}`;
}

export interface AlertDescription {
  title: string;
  detail?: string;
  when: string;
}

function hazardDetail(hazard: ForecastHazard, units: Units, locale: Locale): string {
  const { peak } = hazard;
  const text = getMessages(locale).weather.hazard;
  switch (hazard.metric) {
    case "probability":
      return text.probability(Math.round(peak));
    case "rate":
      return text.rate(formatPrecipitation(peak, units));
    case "total":
      return text.total(formatPrecipitation(peak, units));
    case "gust":
      return text.gust(formatSpeed(peak, units));
    case "max-temp": {
      const days =
        Math.round(
          (Date.parse(`${hazard.end}T00:00Z`) - Date.parse(`${hazard.start}T00:00Z`)) / 86_400_000,
        ) + 1;
      return text.maxTemp(formatTemperature(peak, units), days);
    }
    case "min-temp":
      return text.minTemp(formatTemperature(peak, units));
    case "snowfall":
      return text.snowfall(formatSnowfall(peak, units));
    case "aqi":
      return text.aqi(Math.round(peak), aqiCategory(peak, locale).label);
  }
}

export function describeHazard(
  hazard: ForecastHazard,
  units: Units,
  today: string,
  locale: Locale = DEFAULT_LOCALE,
): AlertDescription {
  const text = getMessages(locale).weather.hazard;
  const when =
    hazard.kind === "air-quality"
      ? text.rightNow
      : hazard.granularity === "hour"
        ? hourWindow(hazard.start, hazard.end, today, locale)
        : dayWindow(hazard.start, hazard.end, today, locale);
  return {
    title: text.titles[hazard.kind][hazard.severity],
    detail: hazardDetail(hazard, units, locale),
    when,
  };
}

/** "Until 5:00 AM today", "Until 2:00 AM Thu Oct 29", or a "from – to" window for an upcoming alert. */
export function describeOfficialWhen(
  alert: OfficialAlert,
  now: string,
  today: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const text = getMessages(locale).weather;
  const { starts, ends } = alert;
  const stamp = (iso: string) =>
    `${relativeDay(iso.slice(0, 10), today, locale)} ${formatTime(iso, locale)}`;
  if (ends && (!starts || starts <= now)) {
    const endDay = ends.slice(0, 10);
    // "5:00 AM today" / "8:00 AM tomorrow" read naturally; a named date goes after the time too.
    const day =
      endDay === today
        ? text.day.today
        : endDay === addDays(today, 1)
          ? text.day.tomorrow
          : relativeDay(endDay, today, locale);
    return text.hazard.until(formatTime(ends, locale), day);
  }
  if (starts && ends) return `${stamp(starts)} – ${stamp(ends)}`;
  if (starts) return text.hazard.from(stamp(starts));
  return text.hazard.activeNow;
}

export function describeAlert(
  alert: WeatherAlert,
  units: Units,
  now: string,
  locale: Locale = DEFAULT_LOCALE,
): AlertDescription {
  const today = now.slice(0, 10);
  if (alert.source === "forecast") return describeHazard(alert, units, today, locale);
  return { title: alert.title, when: describeOfficialWhen(alert, now, today, locale) };
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

/** Most serious first, whoever says so; official before forecast signals only among equals, then by start time. */
export function compareBySeverity(a: WeatherAlert, b: WeatherAlert): number {
  return (
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    Number(a.source === "forecast") - Number(b.source === "forecast") ||
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
