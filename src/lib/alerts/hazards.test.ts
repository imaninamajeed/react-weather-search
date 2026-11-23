import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/forecast-subang-jaya.json";
import { forecastResponseSchema, normalizeForecast } from "@/lib/open-meteo/forecast";
import type { AirQuality, DailyPoint, Forecast, HourlyPoint } from "@/lib/weather/types";
import { THRESHOLDS, detectHazards, runs } from "./hazards";

const real = () => normalizeForecast(forecastResponseSchema.parse(structuredClone(fixture)));

/** A calm baseline: 72 dry hours from 2026-10-27T00:00 and 14 mild days. */
function calm(): Forecast {
  const forecast = real();
  forecast.hourly = Array.from({ length: 72 }, (_, i): HourlyPoint => {
    const day = 27 + Math.floor(i / 24);
    return {
      time: `2026-10-${day}T${String(i % 24).padStart(2, "0")}:00`,
      isDay: true,
      weatherCode: 1,
      temperature: 28,
      apparentTemperature: 30,
      humidity: 70,
      precipitationProbability: 10,
      precipitation: 0,
      windSpeed: 10,
      windGusts: 20,
      uvIndex: 0,
    };
  });
  forecast.daily = Array.from({ length: 14 }, (_, i): DailyPoint => ({
    ...forecast.daily[0],
    date: `2026-10-${String(27 + i).padStart(2, "0")}`.replace(
      /^2026-10-(3[2-9]|[4-9]\d)$/,
      (_, d) => `2026-11-${String(Number(d) - 31).padStart(2, "0")}`,
    ),
    weatherCode: 1,
    temperatureMax: 30,
    temperatureMin: 22,
    precipitationSum: 0,
    snowfallSum: 0,
    windGustsMax: 20,
  }));
  return forecast;
}

const aq = (usAqi: number): AirQuality => ({
  time: "2026-10-27T01:00",
  usAqi,
  pm25: null,
  pm10: null,
  ozone: null,
  nitrogenDioxide: null,
});

describe("runs", () => {
  it("finds consecutive runs", () => {
    expect(runs([false, true, true, false, true])).toEqual([
      [1, 2],
      [4, 4],
    ]);
    expect(runs([])).toEqual([]);
    expect(runs([false, false])).toEqual([]);
  });

  it("bridges small gaps only when asked", () => {
    const flags = [true, false, true, false, false, true];
    expect(runs(flags)).toEqual([
      [0, 0],
      [2, 2],
      [5, 5],
    ]);
    expect(runs(flags, 1)).toEqual([
      [0, 2],
      [5, 5],
    ]);
    expect(runs(flags, 2)).toEqual([[0, 5]]);
  });
});

describe("detectHazards", () => {
  it("is quiet on calm weather", () => {
    expect(detectHazards(calm())).toEqual([]);
  });

  it("raises thunderstorm advisories only above the probability threshold", () => {
    const f = calm();
    f.hourly[15] = { ...f.hourly[15], weatherCode: 95, precipitationProbability: 39 };
    expect(detectHazards(f)).toEqual([]);
    f.hourly[15] = { ...f.hourly[15], precipitationProbability: 40 };
    f.hourly[16] = { ...f.hourly[16], weatherCode: 95, precipitationProbability: 70 };
    expect(detectHazards(f)).toEqual([
      expect.objectContaining({
        kind: "thunderstorm",
        severity: "advisory",
        granularity: "hour",
        start: "2026-10-27T15:00",
        end: "2026-10-27T16:00",
        peak: 70,
      }),
    ]);
  });

  it("escalates hail storms to a warning", () => {
    const f = calm();
    f.hourly[10] = { ...f.hourly[10], weatherCode: 96, precipitationProbability: 80 };
    expect(detectHazards(f)[0]).toMatchObject({ kind: "thunderstorm", severity: "warning" });
  });

  it("merges storm hours separated by a single quiet hour", () => {
    const f = calm();
    for (const i of [10, 12])
      f.hourly[i] = { ...f.hourly[i], weatherCode: 95, precipitationProbability: 60 };
    const storms = detectHazards(f).filter((h) => h.kind === "thunderstorm");
    expect(storms).toHaveLength(1);
    expect(storms[0]).toMatchObject({ start: "2026-10-27T10:00", end: "2026-10-27T12:00" });
    // A gap of two quiet hours starts a new event.
    f.hourly[15] = { ...f.hourly[15], weatherCode: 95, precipitationProbability: 60 };
    expect(detectHazards(f).filter((h) => h.kind === "thunderstorm")).toHaveLength(2);
  });

  it("flags intense hourly rain by rate", () => {
    const f = calm();
    f.hourly[5] = { ...f.hourly[5], precipitation: 9.9 };
    expect(detectHazards(f)).toEqual([]);
    f.hourly[5] = { ...f.hourly[5], precipitation: 12 };
    f.hourly[30] = { ...f.hourly[30], precipitation: 35 };
    expect(detectHazards(f)).toEqual([
      expect.objectContaining({ kind: "rain", metric: "rate", severity: "advisory", peak: 12 }),
      expect.objectContaining({ kind: "rain", metric: "rate", severity: "warning", peak: 35 }),
    ]);
  });

  it("flags heavy rain by daily total and spans consecutive days", () => {
    const f = calm();
    f.daily[1] = { ...f.daily[1], precipitationSum: 29.9 };
    expect(detectHazards(f)).toEqual([]);
    f.daily[1] = { ...f.daily[1], precipitationSum: 35 };
    f.daily[2] = { ...f.daily[2], precipitationSum: 64 };
    expect(detectHazards(f)).toEqual([
      expect.objectContaining({
        kind: "rain",
        metric: "total",
        granularity: "day",
        severity: "warning",
        start: "2026-10-28",
        end: "2026-10-29",
        peak: 64,
      }),
    ]);
  });

  it("drops a downpour already covered by a heavy-rain day, but keeps a stronger one", () => {
    const f = calm();
    f.daily[0] = { ...f.daily[0], precipitationSum: 40 };
    f.hourly[5] = { ...f.hourly[5], precipitation: 12 };
    expect(detectHazards(f).map((h) => h.metric)).toEqual(["total"]);
    f.hourly[5] = { ...f.hourly[5], precipitation: 31 };
    expect(detectHazards(f).map((h) => h.metric)).toEqual(["total", "rate"]);
  });

  it("flags strong gusts", () => {
    const f = calm();
    f.hourly[40] = { ...f.hourly[40], windGusts: 59 };
    expect(detectHazards(f)).toEqual([]);
    f.hourly[40] = { ...f.hourly[40], windGusts: 75 };
    expect(detectHazards(f)[0]).toMatchObject({ kind: "wind", severity: "advisory", peak: 75 });
    f.hourly[41] = { ...f.hourly[41], windGusts: 95 };
    expect(detectHazards(f)[0]).toMatchObject({ severity: "warning", peak: 95 });
  });

  it("calls a heat spell only after three hot days in a row", () => {
    const f = calm();
    f.daily[1].temperatureMax = 36;
    f.daily[2].temperatureMax = 36;
    expect(detectHazards(f)).toEqual([]);
    f.daily[3].temperatureMax = 35;
    expect(detectHazards(f)).toEqual([
      expect.objectContaining({
        kind: "heat",
        severity: "advisory",
        start: "2026-10-28",
        end: "2026-10-30",
        peak: 36,
      }),
    ]);
  });

  it("escalates heat to a warning when three consecutive days reach 37 °C", () => {
    const f = calm();
    for (const i of [1, 2, 3, 4]) f.daily[i].temperatureMax = 36;
    f.daily[2].temperatureMax = f.daily[3].temperatureMax = 37;
    expect(detectHazards(f)[0].severity).toBe("advisory");
    f.daily[1].temperatureMax = 38;
    expect(detectHazards(f)[0]).toMatchObject({ severity: "warning", peak: 38 });
  });

  it("only looks seven days ahead for daily hazards", () => {
    const f = calm();
    f.daily[8].precipitationSum = 100;
    expect(detectHazards(f)).toEqual([]);
  });

  it("flags frost with the lowest temperature as the peak", () => {
    const f = calm();
    f.daily[2].temperatureMin = -3;
    f.daily[3].temperatureMin = -12;
    expect(detectHazards(f)).toEqual([
      expect.objectContaining({
        kind: "frost",
        severity: "warning",
        peak: -12,
        start: "2026-10-29",
        end: "2026-10-30",
      }),
    ]);
  });

  it("flags heavy snow", () => {
    const f = calm();
    f.daily[1].snowfallSum = 4.9;
    expect(detectHazards(f)).toEqual([]);
    f.daily[1].snowfallSum = 6;
    expect(detectHazards(f)[0]).toMatchObject({ kind: "snow", severity: "advisory" });
    f.daily[1].snowfallSum = 25;
    expect(detectHazards(f)[0]).toMatchObject({ severity: "warning", peak: 25 });
  });

  it("flags unhealthy air only when an AQI reading is supplied", () => {
    const f = calm();
    expect(detectHazards(f)).toEqual([]);
    expect(detectHazards(f, aq(150))).toEqual([]);
    expect(detectHazards(f, aq(151))[0]).toMatchObject({
      kind: "air-quality",
      severity: "advisory",
      start: "2026-10-27T01:00",
    });
    expect(detectHazards(f, aq(250))[0]).toMatchObject({ severity: "warning", peak: 250 });
    expect(detectHazards(f, null)).toEqual([]);
  });

  it("finds only the genuine thunderstorm in the real Subang Jaya fixture", () => {
    // Showers of 4.6 mm/h and 32 °C highs are everyday weather there, not hazards; the forecast's
    // WMO 95 thunderstorm on Wednesday afternoon (78 % chance) is.
    expect(detectHazards(real())).toEqual([
      expect.objectContaining({
        kind: "thunderstorm",
        severity: "advisory",
        start: "2026-10-28T14:00",
        end: "2026-10-28T14:00",
        peak: 78,
      }),
    ]);
  });

  it("documents thresholds that are ordered advisory < warning", () => {
    expect(THRESHOLDS.rainRate.advisory).toBeLessThan(THRESHOLDS.rainRate.warning);
    expect(THRESHOLDS.gusts.advisory).toBeLessThan(THRESHOLDS.gusts.warning);
    expect(THRESHOLDS.heat.advisory).toBeLessThan(THRESHOLDS.heat.warning);
    expect(THRESHOLDS.frost.warning).toBeLessThan(THRESHOLDS.frost.advisory);
  });
});
