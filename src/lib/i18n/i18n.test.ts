import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatHour,
  formatHourRange,
  formatMonthName,
  formatTime,
  formatWeekday,
} from "@/lib/format";
import { describeAlert } from "@/lib/alerts/describe";
import type { ForecastHazard } from "@/lib/alerts/types";
import { compassPoint } from "@/lib/units";
import { aqiCategory } from "@/lib/weather/aqi";
import { describeWeather } from "@/lib/weather/codes";
import { describeFeel } from "@/lib/weather/summary";
import { uvCategory } from "@/lib/weather/uv";
import { LOCALES, isLocale, parseLocale } from "./locales";
import { MESSAGES } from "./messages";

describe("locales", () => {
  it("falls back to English for anything it does not recognise", () => {
    expect(parseLocale("ms")).toBe("ms");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("fr")).toBe("en");
    expect(parseLocale("")).toBe("en");
    expect(parseLocale(undefined)).toBe("en");
    expect(isLocale("ms")).toBe(true);
    expect(isLocale("MS")).toBe(false);
  });
});

/** Every path to a string or function in the messages, e.g. "nav.dashboard" or "common.more". */
function paths(node: unknown, prefix = ""): string[] {
  if (typeof node === "string" || typeof node === "function") return [prefix];
  if (Array.isArray(node)) return [`${prefix}[${node.length}]`];
  return Object.entries(node as object).flatMap(([key, value]) =>
    paths(value, prefix ? `${prefix}.${key}` : key),
  );
}

/** Text that is the same in both languages on purpose: names, symbols and shared technical terms. */
const SAME_IN_BOTH = new Set([
  "dashboard.hero.radar",
  "welcome.feature.radar.label",
  "alerts.sources.met-malaysia",
  "nav.imperial",
  "place.history.charts.normal",
  "place.history.charts.normalMedian",
]);

describe("messages", () => {
  it("has the same shape in every language", () => {
    const english = paths(MESSAGES.en);
    for (const locale of LOCALES) expect(paths(MESSAGES[locale])).toEqual(english);
  });

  it("has no empty strings", () => {
    for (const locale of LOCALES) {
      for (const path of paths(MESSAGES[locale])) {
        const value = path
          .split(".")
          .reduce<unknown>((node, key) => (node as never)[key], MESSAGES[locale]);
        if (typeof value === "string") expect(value.trim(), `${locale}:${path}`).not.toBe("");
      }
    }
  });

  it("translates the Malay copy, apart from names that are the same in both", () => {
    const untranslated = paths(MESSAGES.ms).filter((path) => {
      const read = (locale: "en" | "ms") =>
        path.split(".").reduce<unknown>((node, key) => (node as never)[key], MESSAGES[locale]);
      const [en, ms] = [read("en"), read("ms")];
      return (
        typeof en === "string" && en === ms && /[A-Za-z]{4,}/.test(en) && !SAME_IN_BOTH.has(path)
      );
    });
    expect(untranslated).toEqual([]);
  });
});

describe("Malay formatting", () => {
  it("names days, months and hours in Malay", () => {
    expect(formatWeekday("2026-10-27", "long", "ms")).toBe("Selasa");
    expect(formatMonthName(10, "long", "ms")).toBe("Oktober");
    expect(formatHour("2026-10-27T15:00", "ms")).toBe("3 PTG");
    expect(formatTime("2026-10-27T06:12", "ms")).toBe("6:12 PG");
    expect(formatHourRange("2026-10-27T15:00", "2026-10-27T17:00", "ms")).toBe("3–6 PTG");
    expect(formatDuration(43500, "ms")).toBe("12j 05m");
  });

  it("keeps English output unchanged by default", () => {
    expect(formatHour("2026-10-27T15:00")).toBe("3 PM");
    expect(formatHourRange("2026-10-27T11:00", "2026-10-27T13:00")).toBe("11 AM–2 PM");
    expect(formatMonthName(10, "short")).toBe("Oct");
  });
});

describe("Malay text from the domain code", () => {
  it("describes conditions, categories and feel", () => {
    expect(describeWeather(0, true, "ms").label).toBe("Langit Cerah");
    expect(describeWeather(1234, true, "ms").label).toBe("Keadaan Tidak Diketahui");
    expect(aqiCategory(120, "ms").label).toBe("Tidak Sihat untuk Kumpulan Sensitif");
    expect(uvCategory(9, "ms").label).toBe("Sangat Tinggi");
    expect(describeFeel(30, 22, "ms")).toBe("Hangat dan lembap");
    expect(compassPoint(90, "ms")).toBe("T");
    expect(compassPoint(90)).toBe("E");
  });

  it("describes an alert and when it applies", () => {
    const hazard: ForecastHazard = {
      source: "forecast",
      id: "rain-total-2026-10-28",
      kind: "rain",
      severity: "warning",
      granularity: "day",
      start: "2026-10-28",
      end: "2026-10-28",
      peak: 70,
      metric: "total",
    };
    const description = describeAlert(hazard, "metric", "2026-10-27T10:00", "ms");
    expect(description.title).toBe("Hujan Sangat Lebat");
    expect(description.when).toBe("Esok");
    expect(description.detail).toBe("Sekitar 70 mm dijangka sepanjang hari.");
  });
});
