import { minutesOfDay } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";
import type { HourlyPoint } from "./types";

export interface UvCategory {
  label: string;
  /** 0 = low … 4 = extreme. */
  level: 0 | 1 | 2 | 3 | 4;
}

/** WHO UV index bands. */
export function uvCategory(uv: number, locale: Locale = DEFAULT_LOCALE): UvCategory {
  const { uv: text } = getMessages(locale).weather;
  if (uv < 3) return { label: text.low, level: 0 };
  if (uv < 6) return { label: text.moderate, level: 1 };
  if (uv < 8) return { label: text.high, level: 2 };
  if (uv < 11) return { label: text.veryHigh, level: 3 };
  return { label: text.extreme, level: 4 };
}

/**
 * Hours on the current local day, from now on, when sun protection is advised (UV ≥ 3).
 * Returns the first and last such hour (naive local timestamps), or null.
 */
export function uvProtectionWindow(
  hourly: HourlyPoint[],
  currentTime: string,
): { first: string; last: string } | null {
  const day = currentTime.slice(0, 10);
  const hours = hourly.filter((h) => h.time.startsWith(day) && h.uvIndex >= 3);
  if (hours.length === 0) return null;
  const sorted = [...hours].sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
  return { first: sorted[0].time, last: sorted[sorted.length - 1].time };
}
