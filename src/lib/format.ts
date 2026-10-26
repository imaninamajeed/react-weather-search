/**
 * Date/time formatting for naive local ISO strings ("2026-10-27T14:00" / "2026-10-27").
 *
 * The upstream already returns wall-clock times in the place's timezone, so we
 * never convert them: treating the string as UTC and formatting with
 * `timeZone: "UTC"` prints the same wall-clock digits regardless of where the
 * server or the viewer is. (The original app used `new Date(unix * 1000)` and
 * `getDay()`, which silently shifted every time into the viewer's timezone.)
 */

const LOCALE = "en-US";

function wallClock(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : `${iso}Z`);
}

function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" }).format(wallClock(iso));
}

/** "Tue" / "Tuesday" */
export function formatWeekday(iso: string, style: "short" | "long" = "short"): string {
  return format(iso, { weekday: style });
}

/** "Oct 27" */
export function formatDayMonth(iso: string): string {
  return format(iso, { day: "numeric", month: "short" });
}

/** "Tuesday, October 27" */
export function formatLongDate(iso: string): string {
  return format(iso, { weekday: "long", day: "numeric", month: "long" });
}

/** "3 PM" */
export function formatHour(iso: string): string {
  return format(iso, { hour: "numeric", hour12: true });
}

/** "6:12 AM" */
export function formatTime(iso: string): string {
  return format(iso, { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "Tuesday 14:05" – used for the "local time" line in the hero. */
export function formatWeekdayClock(iso: string): string {
  const weekday = format(iso, { weekday: "long" });
  const clock = format(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${weekday} ${clock}`;
}

/** "12h 05m" */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
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
const meridiem = (hour: number) => (hour < 12 ? "AM" : "PM");

/**
 * "3–6 PM" or "11 AM–2 PM" for a run of whole hours, from the first hour's start to the
 * end of the last hour. Both arguments are naive local timestamps.
 */
export function formatHourRange(firstHour: string, lastHour: string): string {
  const start = Number(firstHour.slice(11, 13));
  const end = (Number(lastHour.slice(11, 13)) + 1) % 24;
  if (meridiem(start) === meridiem(end)) return `${hour12(start)}–${hour12(end)} ${meridiem(end)}`;
  return `${hour12(start)} ${meridiem(start)}–${hour12(end)} ${meridiem(end)}`;
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
