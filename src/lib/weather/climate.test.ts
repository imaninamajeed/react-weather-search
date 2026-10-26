import { describe, expect, it } from "vitest";
import recentFixture from "@/test/fixtures/archive-recent-subang-jaya.json";
import { normalizeArchive } from "@/lib/open-meteo/archive";
import {
  buildNormals,
  compareDays,
  compareMonths,
  historyWindow,
  percentile,
  slotOf,
  summarizeHistory,
  trimTrailingGaps,
  type ClimateNormals,
  type DailySeries,
} from "./climate";

/** Every day from `start` to `end` inclusive. */
function dates(start: string, end: string): string[] {
  const result: string[] = [];
  for (let t = Date.parse(`${start}T00:00Z`); t <= Date.parse(`${end}T00:00Z`); t += 86_400_000) {
    result.push(new Date(t).toISOString().slice(0, 10));
  }
  return result;
}

/** 30 years where each year is offset from a seasonal base by −2…+2 °C, with 1 mm of rain a day. */
function synthetic(base: (date: string) => number): DailySeries {
  const time = dates("1991-01-01", "2020-12-31");
  return {
    time,
    temperatureMax: time.map((date) => base(date) + ((Number(date.slice(0, 4)) - 1991) % 5) - 2),
    precipitation: time.map(() => 1),
  };
}

describe("slotOf", () => {
  it("indexes days of a leap year", () => {
    expect(slotOf("2021-01-01")).toBe(0);
    expect(slotOf("2020-02-29")).toBe(59);
    expect(slotOf("2021-03-01")).toBe(60);
    expect(slotOf("2021-12-31")).toBe(365);
  });
});

describe("percentile", () => {
  it("interpolates between ranks", () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentile([1, 2, 3, 4, 5], 0.1)).toBeCloseTo(1.4);
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
    expect(percentile([1, 2, 3, 4, 5], 1)).toBe(5);
    expect(percentile([7], 0.9)).toBe(7);
    expect(percentile([], 0.5)).toBeNaN();
  });
});

describe("buildNormals", () => {
  const flat = buildNormals(synthetic(() => 30));

  it("orders the percentiles and centres the median on the base", () => {
    for (let slot = 0; slot < 366; slot++) {
      expect(flat.temperatureMax.p10[slot]).toBeLessThan(flat.temperatureMax.median[slot]);
      expect(flat.temperatureMax.median[slot]).toBeLessThan(flat.temperatureMax.p90[slot]);
    }
    expect(flat.temperatureMax.median[100]).toBeCloseTo(30, 0);
    expect(flat.temperatureMax.p10[100]).toBeCloseTo(28, 0);
    expect(flat.temperatureMax.p90[100]).toBeCloseTo(32, 0);
  });

  it("follows the seasons", () => {
    const seasonal = buildNormals(
      synthetic((date) => 20 + 10 * Math.sin((2 * Math.PI * slotOf(date)) / 366)),
    );
    const mid = (slot: number) => seasonal.temperatureMax.median[slot];
    expect(mid(91)).toBeGreaterThan(mid(0) + 8); // late spring is warmer than 1 Jan
    expect(mid(274)).toBeLessThan(mid(91) - 8);
  });

  it("pools days across the new year", () => {
    const series = synthetic(() => 30);
    // A heat spell in the last days of December must show up in the 1 Jan normal (slot 0).
    series.temperatureMax = series.temperatureMax.map((value, i) =>
      /-12-(29|30|31)$/.test(series.time[i]) ? 45 : value,
    );
    const normals = buildNormals(series);
    expect(normals.temperatureMax.p90[0]).toBeGreaterThan(flat.temperatureMax.p90[0]);
  });

  it("averages monthly rainfall, counting leap Februaries", () => {
    expect(flat.monthlyRain[0]).toBe(31);
    expect(flat.monthlyRain[3]).toBe(30);
    expect(flat.monthlyRain[1]).toBeCloseTo(28.25, 1); // 7 leap years of 30
  });

  it("ignores months with missing data", () => {
    const series = synthetic(() => 30);
    // Blank one day of every January: no complete January remains.
    series.precipitation = series.precipitation.map((value, i) =>
      series.time[i].endsWith("-01-15") || series.time[i].endsWith("-01-16") ? null : value,
    );
    expect(buildNormals(series).monthlyRain[0]).toBeNaN();
  });
});

describe("historyWindow", () => {
  it("starts on the first of the month a year before and ends three days back", () => {
    expect(historyWindow("2026-10-27")).toEqual({ start: "2025-11-01", end: "2026-10-24" });
    expect(historyWindow("2026-03-02")).toEqual({ start: "2025-03-01", end: "2026-02-27" });
  });

  it("handles the turn of the year", () => {
    expect(historyWindow("2026-01-02")).toEqual({ start: "2025-01-01", end: "2025-12-30" });
    expect(historyWindow("2026-01-20")).toEqual({ start: "2025-02-01", end: "2026-01-17" });
  });
});

describe("trimTrailingGaps", () => {
  it("drops unfilled days at the end only", () => {
    const series: DailySeries = {
      time: ["a", "b", "c", "d"],
      temperatureMax: [1, null, 3, null],
      precipitation: [0, 0, 0, null],
    };
    expect(trimTrailingGaps(series).time).toEqual(["a", "b", "c"]);
  });
});

describe("comparison", () => {
  const normals: ClimateNormals = {
    temperatureMax: {
      p10: Array.from({ length: 366 }, () => 28),
      median: Array.from({ length: 366 }, () => 30),
      p90: Array.from({ length: 366 }, () => 32),
    },
    monthlyRain: Array.from({ length: 12 }, () => 100),
  };

  it("summarizes anomalies, outliers and extremes", () => {
    const recent: DailySeries = {
      time: ["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04"],
      temperatureMax: [33, 27, 30, 31],
      precipitation: [0, 12, 0, 40],
    };
    const days = compareDays(recent, normals);
    const summary = summarizeHistory(days, compareMonths(recent, normals));
    expect(summary).toMatchObject({
      days: 4,
      meanAnomaly: 0.25, // (3 − 3 + 0 + 1) / 4
      daysAboveNormalRange: 1,
      daysBelowNormalRange: 1,
      warmest: { date: "2026-05-01", value: 33 },
      coldest: { date: "2026-05-02", value: 27 },
      wettest: { date: "2026-05-04", value: 40 },
      rainTotal: 52,
    });
  });

  it("prorates the normal for a month still in progress", () => {
    const recent: DailySeries = {
      time: dates("2026-05-01", "2026-05-10"),
      temperatureMax: Array(10).fill(30),
      precipitation: Array(10).fill(5),
    };
    const [may] = compareMonths(recent, normals);
    expect(may.coverage).toBeCloseTo(10 / 31);
    expect(may.normal).toBeCloseTo(100 * (10 / 31));
    const summary = summarizeHistory(compareDays(recent, normals), [may]);
    expect(summary.rainPercentOfNormal).toBeCloseTo((50 / (100 * (10 / 31))) * 100);
  });

  it("copes with gaps and with nothing at all", () => {
    const recent: DailySeries = {
      time: ["2026-05-01", "2026-05-02"],
      temperatureMax: [null, 31],
      precipitation: [null, null],
    };
    const summary = summarizeHistory(compareDays(recent, normals), compareMonths(recent, normals));
    expect(summary.days).toBe(1);
    expect(summary.wettest).toBeNull();
    expect(summary.rainPercentOfNormal).toBeNull();
    const empty = summarizeHistory([], []);
    expect(empty).toMatchObject({ days: 0, meanAnomaly: 0, warmest: null });
  });
});

describe("with real ERA5 data for Subang Jaya", () => {
  const recent = normalizeArchive(recentFixture);

  it("normalizes the archive response", () => {
    expect(recent.time).toHaveLength(355);
    expect(recent.time[0]).toBe("2025-11-01");
    // ERA5 occasionally has a gap day; it must survive as null, not 0.
    expect(recent.temperatureMax.filter((value) => value === null)).toHaveLength(1);
  });

  it("groups into twelve months, the last one partial", () => {
    const months = compareMonths(recent, buildNormals(synthetic(() => 31)));
    expect(months).toHaveLength(12);
    expect(months[0]).toMatchObject({ month: "2025-11", coverage: 1 });
    expect(months[11]).toMatchObject({ month: "2026-10" });
    // 21 days elapsed, but the fixture has one gap day in October that must not count as dry.
    expect(months[11].coverage).toBeCloseTo(20 / 31);
  });

  it("finds the year's warmest day", () => {
    const normals = buildNormals(synthetic(() => 31));
    const summary = summarizeHistory(compareDays(recent, normals), compareMonths(recent, normals));
    expect(summary.warmest?.value).toBe(35.9);
    expect(summary.wettest?.value).toBe(121.1);
  });
});
