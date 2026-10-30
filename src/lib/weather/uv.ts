import { minutesOfDay } from "@/lib/format";
import type { HourlyPoint } from "./types";

export interface UvCategory {
  label: string;
  /** 0 = low … 4 = extreme. */
  level: 0 | 1 | 2 | 3 | 4;
}

/** WHO UV index bands. */
export function uvCategory(uv: number): UvCategory {
  if (uv < 3) return { label: "Low", level: 0 };
  if (uv < 6) return { label: "Moderate", level: 1 };
  if (uv < 8) return { label: "High", level: 2 };
  if (uv < 11) return { label: "Very High", level: 3 };
  return { label: "Extreme", level: 4 };
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
