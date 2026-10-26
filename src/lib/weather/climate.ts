import { addDays } from "@/lib/format";

/**
 * Climate comparison: how the last twelve months compare with 1991–2020 "normals" built
 * from the ERA5 reanalysis. Pure functions; the fetching lives in lib/open-meteo/archive.ts.
 */

export const NORMALS_PERIOD = { start: "1991-01-01", end: "2020-12-31" } as const;

/** Days either side of a calendar day pooled into its normal, to smooth the 30 samples per day. */
const WINDOW_DAYS = 7;
const SLOTS = 366;
/** Cumulative day counts at the start of each month, in a leap year (so 29 Feb has its own slot). */
const MONTH_START = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

export interface DailySeries {
  /** "YYYY-MM-DD" */
  time: string[];
  /** Daily high, °C; null where the archive has no value. */
  temperatureMax: Array<number | null>;
  /** Daily rainfall total, mm. */
  precipitation: Array<number | null>;
}

export interface ClimateNormals {
  /** Daily-high percentiles by calendar day (366 slots, index from 1 Jan in a leap year), °C. */
  temperatureMax: { p10: number[]; median: number[]; p90: number[] };
  /** Mean rainfall per calendar month (Jan = 0), mm. */
  monthlyRain: number[];
}

/** Calendar-day slot 0–365; 29 Feb is slot 59. */
export function slotOf(date: string): number {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return MONTH_START[month - 1] + day - 1;
}

/** Linear-interpolated percentile of an ascending array, p in [0, 1]. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Builds normals from a multi-decade daily series. */
export function buildNormals(series: DailySeries): ClimateNormals {
  const buckets: number[][] = Array.from({ length: SLOTS }, () => []);
  const monthTotals = new Map<string, { total: number; days: number }>();

  series.time.forEach((date, index) => {
    const high = series.temperatureMax[index];
    if (high !== null) buckets[slotOf(date)].push(high);

    const rain = series.precipitation[index];
    if (rain !== null) {
      const key = date.slice(0, 7);
      const entry = monthTotals.get(key) ?? { total: 0, days: 0 };
      entry.total += rain;
      entry.days += 1;
      monthTotals.set(key, entry);
    }
  });

  const p10: number[] = [];
  const median: number[] = [];
  const p90: number[] = [];
  for (let slot = 0; slot < SLOTS; slot++) {
    const pooled: number[] = [];
    for (let offset = -WINDOW_DAYS; offset <= WINDOW_DAYS; offset++) {
      pooled.push(...buckets[(slot + offset + SLOTS) % SLOTS]);
    }
    pooled.sort((a, b) => a - b);
    p10.push(percentile(pooled, 0.1));
    median.push(percentile(pooled, 0.5));
    p90.push(percentile(pooled, 0.9));
  }

  // Mean over years of each month's total, counting only months that are essentially complete.
  const perMonth: number[][] = Array.from({ length: 12 }, () => []);
  for (const [key, { total, days }] of monthTotals) {
    const year = Number(key.slice(0, 4));
    const month = Number(key.slice(5, 7));
    if (days >= daysInMonth(year, month) - 1) perMonth[month - 1].push(total);
  }
  const monthlyRain = perMonth.map((totals) =>
    totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : NaN,
  );

  return { temperatureMax: { p10, median, p90 }, monthlyRain };
}

/**
 * The window of recent days to compare: from the first of the month twelve months before the
 * last available day, so every month shown is complete except the current one. The archive runs
 * a day or two behind, so `lastAvailable` is `today` minus a safety margin.
 */
export function historyWindow(today: string): { start: string; end: string } {
  const end = addDays(today, -3);
  const year = Number(end.slice(0, 4));
  const month = Number(end.slice(5, 7));
  const start =
    month === 12 ? `${year}-01-01` : `${year - 1}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, end };
}

/** Drops trailing days the archive hasn't filled in yet. */
export function trimTrailingGaps(series: DailySeries): DailySeries {
  let length = series.time.length;
  while (length > 0 && series.temperatureMax[length - 1] === null) length--;
  return {
    time: series.time.slice(0, length),
    temperatureMax: series.temperatureMax.slice(0, length),
    precipitation: series.precipitation.slice(0, length),
  };
}

export interface DayComparison {
  date: string;
  temperatureMax: number | null;
  precipitation: number | null;
  normalLow: number;
  normalMedian: number;
  normalHigh: number;
}

export function compareDays(recent: DailySeries, normals: ClimateNormals): DayComparison[] {
  return recent.time.map((date, index) => {
    const slot = slotOf(date);
    return {
      date,
      temperatureMax: recent.temperatureMax[index],
      precipitation: recent.precipitation[index],
      normalLow: normals.temperatureMax.p10[slot],
      normalMedian: normals.temperatureMax.median[slot],
      normalHigh: normals.temperatureMax.p90[slot],
    };
  });
}

export interface MonthComparison {
  /** "YYYY-MM" */
  month: string;
  actual: number;
  /** The normal for the days covered, so a month still in progress is compared fairly. */
  normal: number;
  /** Share of the month covered by data, 0–1. */
  coverage: number;
}

export function compareMonths(recent: DailySeries, normals: ClimateNormals): MonthComparison[] {
  const months = new Map<string, { total: number; days: number }>();
  recent.time.forEach((date, index) => {
    const rain = recent.precipitation[index];
    if (rain === null) return;
    const key = date.slice(0, 7);
    const entry = months.get(key) ?? { total: 0, days: 0 };
    entry.total += rain;
    entry.days += 1;
    months.set(key, entry);
  });

  return [...months.entries()].map(([month, { total, days }]) => {
    const monthIndex = Number(month.slice(5, 7)) - 1;
    const full = daysInMonth(Number(month.slice(0, 4)), monthIndex + 1);
    const coverage = Math.min(1, days / full);
    return { month, actual: total, normal: normals.monthlyRain[monthIndex] * coverage, coverage };
  });
}

export interface HistorySummary {
  days: number;
  /** Mean of (daily high − normal median), °C. */
  meanAnomaly: number;
  rainTotal: number;
  rainNormal: number;
  /** Rain as a percentage of the normal for the same period, or null if there's no normal. */
  rainPercentOfNormal: number | null;
  daysAboveNormalRange: number;
  daysBelowNormalRange: number;
  /** About 10 % of days are expected on each side by construction (p10 / p90). */
  expectedOutside: number;
  warmest: { date: string; value: number } | null;
  coldest: { date: string; value: number } | null;
  wettest: { date: string; value: number } | null;
}

export function summarizeHistory(days: DayComparison[], months: MonthComparison[]): HistorySummary {
  const withHigh = days.filter((day) => day.temperatureMax !== null);
  const anomalies = withHigh.map((day) => day.temperatureMax! - day.normalMedian);
  const extreme = (
    pick: (a: number, b: number) => boolean,
    field: "temperatureMax" | "precipitation",
  ) => {
    let best: { date: string; value: number } | null = null;
    for (const day of days) {
      const value = day[field];
      if (value !== null && (best === null || pick(value, best.value)))
        best = { date: day.date, value };
    }
    return best;
  };

  const rainTotal = months.reduce((sum, month) => sum + month.actual, 0);
  const rainNormal = months.reduce((sum, month) => sum + month.normal, 0);

  return {
    days: withHigh.length,
    meanAnomaly: anomalies.length ? anomalies.reduce((a, b) => a + b, 0) / anomalies.length : 0,
    rainTotal,
    rainNormal,
    rainPercentOfNormal: rainNormal > 0 ? (rainTotal / rainNormal) * 100 : null,
    daysAboveNormalRange: withHigh.filter((day) => day.temperatureMax! > day.normalHigh).length,
    daysBelowNormalRange: withHigh.filter((day) => day.temperatureMax! < day.normalLow).length,
    expectedOutside: Math.round(withHigh.length * 0.1),
    warmest: extreme((a, b) => a > b, "temperatureMax"),
    coldest: extreme((a, b) => a < b, "temperatureMax"),
    wettest: extreme((a, b) => a > b, "precipitation"),
  };
}
