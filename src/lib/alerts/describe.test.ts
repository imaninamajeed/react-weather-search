import { describe, expect, it } from "vitest";
import { compareAlerts, describeAlert, describeHazard, relativeDay, sortAlerts } from "./describe";
import type { ForecastHazard, OfficialAlert } from "./types";

const TODAY = "2026-10-27";
const NOW = "2026-10-27T01:15";

const hazard = (overrides: Partial<ForecastHazard>): ForecastHazard => ({
  source: "forecast",
  id: "h",
  kind: "thunderstorm",
  severity: "advisory",
  granularity: "hour",
  start: "2026-10-27T15:00",
  end: "2026-10-27T17:00",
  peak: 70,
  metric: "probability",
  ...overrides,
});

const official = (overrides: Partial<OfficialAlert> = {}): OfficialAlert => ({
  source: "met-malaysia",
  id: "o",
  severity: "warning",
  kind: "thunderstorm",
  title: "Thunderstorms Warning",
  text: "text",
  starts: "2026-10-27T00:00",
  ends: "2026-10-27T05:00",
  issuer: "MET Malaysia",
  url: "https://example.test",
  ...overrides,
});

describe("relativeDay", () => {
  it("names today and tomorrow, otherwise the weekday and date", () => {
    expect(relativeDay("2026-10-27", TODAY)).toBe("Today");
    expect(relativeDay("2026-10-28", TODAY)).toBe("Tomorrow");
    expect(relativeDay("2026-10-30", TODAY)).toBe("Fri Oct 30");
    expect(relativeDay("2026-11-01", "2026-10-31")).toBe("Tomorrow");
  });
});

describe("describeHazard", () => {
  it("describes an hourly window", () => {
    expect(describeHazard(hazard({}), "metric", TODAY)).toEqual({
      title: "Thunderstorms",
      detail: "Up to 70% chance of rain.",
      when: "Today 3–6 PM",
    });
  });

  it("spans midnight with both days named", () => {
    const text = describeHazard(
      hazard({ start: "2026-10-27T22:00", end: "2026-10-28T01:00" }),
      "metric",
      TODAY,
    );
    expect(text.when).toBe("Today 10 PM – Tomorrow 2 AM");
  });

  it("uses day granularity for daily hazards", () => {
    const heat = hazard({
      kind: "heat",
      metric: "max-temp",
      granularity: "day",
      start: "2026-10-28",
      end: "2026-10-30",
      peak: 36.4,
      severity: "warning",
    });
    expect(describeHazard(heat, "metric", TODAY)).toEqual({
      title: "Heat Wave",
      detail: "Highs up to 36° for 3 days.",
      when: "Tomorrow – Fri Oct 30",
    });
  });

  it("converts to the viewer's units", () => {
    const wind = hazard({ kind: "wind", metric: "gust", peak: 80 });
    expect(describeHazard(wind, "metric", TODAY).detail).toBe("Gusts up to 80 km/h.");
    expect(describeHazard(wind, "imperial", TODAY).detail).toBe("Gusts up to 50 mph.");
    const snow = hazard({
      kind: "snow",
      metric: "snowfall",
      granularity: "day",
      start: "2026-10-28",
      end: "2026-10-28",
      peak: 10,
    });
    expect(describeHazard(snow, "imperial", TODAY).detail).toBe("Up to 3.9 in expected in a day.");
    expect(describeHazard(snow, "metric", TODAY).when).toBe("Tomorrow");
  });

  it("says 'Right now' for air quality", () => {
    const aqi = hazard({ kind: "air-quality", metric: "aqi", peak: 162 });
    expect(describeHazard(aqi, "metric", TODAY)).toMatchObject({
      detail: "US AQI 162 (Unhealthy).",
      when: "Right now",
    });
  });
});

describe("describeAlert for official alerts", () => {
  it("says 'Until' for a warning already in force", () => {
    expect(describeAlert(official(), "metric", NOW).when).toBe("Until 5:00 AM today");
  });

  it("phrases other end dates naturally", () => {
    expect(describeAlert(official({ ends: "2026-10-28T08:00" }), "metric", NOW).when).toBe(
      "Until 8:00 AM tomorrow",
    );
    expect(describeAlert(official({ ends: "2026-10-30T14:00" }), "metric", NOW).when).toBe(
      "Until 2:00 PM Fri Oct 30",
    );
  });

  it("gives a window for an upcoming warning", () => {
    const upcoming = official({ starts: "2026-10-27T15:00", ends: "2026-10-28T06:30" });
    expect(describeAlert(upcoming, "metric", NOW).when).toBe("Today 3:00 PM – Tomorrow 6:30 AM");
  });

  it("copes with missing times", () => {
    expect(describeAlert(official({ starts: null, ends: null }), "metric", NOW).when).toBe(
      "Active now",
    );
    expect(
      describeAlert(official({ starts: "2026-10-28T09:00", ends: null }), "metric", NOW).when,
    ).toBe("From Tomorrow 9:00 AM");
  });
});

describe("sortAlerts", () => {
  it("puts official warnings first, then severity, then time", () => {
    const sorted = sortAlerts([
      hazard({ id: "late-advisory", start: "2026-10-27T20:00" }),
      hazard({ id: "early-advisory", start: "2026-10-27T09:00" }),
      hazard({ id: "forecast-warning", severity: "warning" }),
      official({ id: "official-advisory", severity: "advisory" }),
      official({ id: "official-warning" }),
    ]);
    expect(sorted.map((a) => a.id)).toEqual([
      "official-warning",
      "official-advisory",
      "forecast-warning",
      "early-advisory",
      "late-advisory",
    ]);
  });
});

describe("compareAlerts", () => {
  it("orders any two alerts the way sortAlerts does, so alerts from several places can be merged", () => {
    const officialWarning = official({ id: "a" });
    const forecastWarning = hazard({ id: "b", severity: "warning" });
    const forecastAdvisory = hazard({ id: "c" });
    expect(compareAlerts(officialWarning, forecastWarning)).toBeLessThan(0);
    expect(compareAlerts(forecastWarning, forecastAdvisory)).toBeLessThan(0);
    expect(compareAlerts(forecastAdvisory, forecastAdvisory)).toBe(0);
    expect(
      sortAlerts([forecastAdvisory, forecastWarning, officialWarning]).map((a) => a.id),
    ).toEqual(["a", "b", "c"]);
  });
});
