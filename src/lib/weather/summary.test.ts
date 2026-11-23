import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/forecast-subang-jaya.json";
import { forecastResponseSchema, normalizeForecast } from "@/lib/open-meteo/forecast";
import { describeFeel, describeRainOutlook, summarizeToday } from "./summary";
import type { Forecast, HourlyPoint } from "./types";

const base = () => normalizeForecast(forecastResponseSchema.parse(structuredClone(fixture)));

const hour = (time: string, overrides: Partial<HourlyPoint> = {}): HourlyPoint => ({
  time,
  isDay: true,
  weatherCode: 1,
  temperature: 28,
  apparentTemperature: 30,
  humidity: 70,
  precipitationProbability: 10,
  precipitation: 0,
  windSpeed: 10,
  windGusts: 15,
  uvIndex: 0,
  ...overrides,
});

/** 24 dry hours starting 08:00 on the current day, with overrides by offset. */
function withHours(overrides: Record<number, Partial<HourlyPoint>>): Forecast {
  const forecast = base();
  forecast.current = {
    ...forecast.current,
    time: "2026-10-27T08:15",
    apparentTemperature: 28,
    dewPoint: 18,
  };
  forecast.hourly = Array.from({ length: 24 }, (_, i) => {
    const h = 8 + i;
    const date = h < 24 ? "2026-10-27" : "2026-10-28";
    const time = `${date}T${String(h % 24).padStart(2, "0")}:00`;
    return hour(time, overrides[i]);
  });
  return forecast;
}

describe("describeFeel", () => {
  it.each([
    [2, 0, "Cold"],
    [15, 5, "Cool"],
    [29, 18, "Warm"],
    [29, 22, "Warm and humid"],
    [36, 24, "Hot and humid"],
    [40, 10, "Very hot"],
  ])("apparent %i°C / dew point %i°C → %s", (apparent, dew, expected) => {
    expect(describeFeel(apparent, dew)).toBe(expected);
  });

  it("only calls cool weather humid when it is also warm", () => {
    expect(describeFeel(18, 21)).toBe("Cool");
  });
});

describe("summarizeToday", () => {
  it("says so when the next 24 hours are dry", () => {
    expect(summarizeToday(withHours({}), "metric")).toBe(
      "Warm. Staying dry for the next 24 hours.",
    );
  });

  it("names a thunderstorm window later today", () => {
    const forecast = withHours({
      7: { weatherCode: 95, precipitationProbability: 70, precipitation: 3 },
      8: { weatherCode: 95, precipitationProbability: 70, precipitation: 3 },
      9: { weatherCode: 95, precipitationProbability: 60, precipitation: 1 },
    });
    expect(summarizeToday(forecast, "metric")).toBe("Warm. Thunderstorms likely 3–6 PM today.");
  });

  it("labels a window after midnight as tomorrow and uses 12-hour wrap-around", () => {
    const forecast = withHours({
      17: { precipitationProbability: 80 },
      18: { precipitationProbability: 80 },
    });
    expect(summarizeToday(forecast, "metric")).toContain("Rain likely 1–3 AM tomorrow.");
  });

  it("describes rain that is already falling", () => {
    const forecast = withHours({
      0: { precipitation: 1 },
      1: { precipitation: 1 },
      2: { precipitation: 1 },
    });
    expect(summarizeToday(forecast, "metric")).toContain("Rain now, easing around 11 AM.");
  });

  it("handles rain through the whole horizon", () => {
    const wet = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i, { precipitation: 1 }]));
    expect(summarizeToday(withHours(wet), "metric")).toContain(
      "Rain continuing through the next 24 hours.",
    );
  });

  it("calls out heavy rain and snow", () => {
    expect(summarizeToday(withHours({ 3: { precipitation: 6 } }), "metric")).toContain(
      "Heavy rain likely",
    );
    expect(
      summarizeToday(withHours({ 3: { precipitation: 1, weatherCode: 73 } }), "metric"),
    ).toContain("Snow likely");
  });

  it("mentions strong gusts in the viewer's units", () => {
    const forecast = withHours({ 4: { windGusts: 80 } });
    expect(summarizeToday(forecast, "metric")).toContain("Gusts up to 80 km/h.");
    expect(summarizeToday(forecast, "imperial")).toContain("Gusts up to 50 mph.");
  });

  it("summarizes the real Subang Jaya fixture", () => {
    expect(summarizeToday(base(), "metric")).toBe("Warm and humid. Rain now, easing around 10 AM.");
  });
});

describe("describeRainOutlook", () => {
  const wet = { precipitationProbability: 80 };
  const outlook = (overrides: Record<number, Partial<HourlyPoint>>) =>
    describeRainOutlook(withHours(overrides).hourly);

  it("says so when the next 24 hours are dry", () => {
    expect(outlook({})).toBe("Dry for the next 24 h");
  });

  it("names the hour rain starts", () => {
    // Offset 7 from 08:00 is 3 PM.
    expect(outlook({ 7: wet, 8: wet })).toBe("Rain from 3 PM");
  });

  it("says when rain that is falling now stops", () => {
    expect(outlook({ 0: wet, 1: wet, 2: wet })).toBe("Rain until 11 AM");
  });

  it("says when it rains all day", () => {
    const allWet = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i, wet]));
    expect(outlook(allWet)).toBe("Rain for the next 24 h");
  });

  it("names the kind of weather, as the hero does", () => {
    expect(outlook({ 7: { ...wet, weatherCode: 95 } })).toBe("Thunderstorms from 3 PM");
  });

  it("adds tomorrow when the rain is not until the next day", () => {
    // Offset 20 from 08:00 is 4 AM the next day.
    expect(outlook({ 20: wet })).toBe("Rain from 4 AM tomorrow");
  });
});
