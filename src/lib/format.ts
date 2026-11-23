/**
 * Date/time formatting for naive local ISO strings ("2026-10-27T14:00" / "2026-10-27").
 *
 * The upstream already returns wall-clock times in the place's timezone, so we
 * never convert them: treating the string as UTC and formatting with
 * `timeZone: "UTC"` prints the same wall-clock digits regardless of where the
 * server or the viewer is. (The original app used `new Date(unix * 1000)` and
 * `getDay()`, which silently shifted every time into the viewer's timezone.)
 */

import { DEFAULT_LOCALE, INTL_TAGS, type Locale } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";

function wallClock(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : `${iso}Z`);
}

function format(iso: string, options: Intl.DateTimeFormatOptions, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], { ...options, timeZone: "UTC" }).format(
    wallClock(iso),
  );
}

/** "Oct" / "October" for a month number, 1–12. */
export function formatMonthName(
  month: number,
  style: "short" | "long" = "short",
  locale: Locale = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], { month: style, timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, month - 1, 1)),
  );
}

/** "Tue" / "Tuesday" */
export function formatWeekday(
  iso: string,
  style: "short" | "long" = "short",
  locale: Locale = DEFAULT_LOCALE,
): string {
  return format(iso, { weekday: style }, locale);
}

/** "Oct 27" */
export function formatDayMonth(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return format(iso, { day: "numeric", month: "short" }, locale);
}

/** "Tuesday, October 27" */
export function formatLongDate(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return format(iso, { weekday: "long", day: "numeric", month: "long" }, locale);
}

/** "3 PM" */
export function formatHour(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return format(iso, { hour: "numeric", hour12: true }, locale);
}

/** "6:12 AM" */
export function formatTime(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return format(iso, { hour: "numeric", minute: "2-digit", hour12: true }, locale);
}

/** "Tuesday 14:05" – used for the "local time" line in the hero. */
export function formatWeekdayClock(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  const weekday = format(iso, { weekday: "long" }, locale);
  const clock = format(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, locale);
  return `${weekday} ${clock}`;
}

/** "12h 05m" */
export function formatDuration(seconds: number, locale: Locale = DEFAULT_LOCALE): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return getMessages(locale).common.duration(hours, String(minutes).padStart(2, "0"));
}

/** "Subang Jaya" subtitle pieces, skipping a region that repeats the name. */
export function formatPlaceSubtitle(place: { name: string; region?: string; country?: string }) {
  const region = place.region && place.region !== place.name ? place.region : undefined;
  return [region, place.country].filter(Boolean).join(", ");
}

/** Minutes since midnight of a naive local time. */
export function minutesOfDay(iso: string): number {
  const [hours, minutes] = iso.slice(11, 16).split(":").map(Number);
  return hours * 60 + minutes;
}

/** True if both naive timestamps fall on the same local calendar day. */
export function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

const hour12 = (hour: number) => hour % 12 || 12;
const meridiem = (hour: number, locale: Locale) =>
  getMessages(locale).common[hour < 12 ? "am" : "pm"];

/**
 * "3–6 PM" or "11 AM–2 PM" for a run of whole hours, from the first hour's start to the
 * end of the last hour. Both arguments are naive local timestamps.
 */
export function formatHourRange(
  firstHour: string,
  lastHour: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const start = Number(firstHour.slice(11, 13));
  const end = (Number(lastHour.slice(11, 13)) + 1) % 24;
  const [from, to] = [meridiem(start, locale), meridiem(end, locale)];
  if (from === to) return `${hour12(start)}–${hour12(end)} ${to}`;
  return `${hour12(start)} ${from}–${hour12(end)} ${to}`;
}

/** "UTC+8", "UTC+5:30", "UTC−3" */
export function formatUtcOffset(seconds: number): string {
  const sign = seconds < 0 ? "−" : "+";
  const totalMinutes = Math.abs(Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
}

/** Converts an ISO timestamp carrying an offset ("…-04:00", "…Z") to wall-clock time in `timeZone`. */
export function isoToWallClock(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid timestamp: ${iso}`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** The naive timestamp `days` calendar days after a naive date or timestamp (DST-free: wall-clock arithmetic). */
export function addDays(iso: string, days: number): string {
  const date = wallClock(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return iso.length === 10 ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 16);
}

/** The timestamp one hour after a naive hourly timestamp. */
export function addHours(iso: string, hours: number): string {
  const date = wallClock(iso);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString().slice(0, 16);
}
