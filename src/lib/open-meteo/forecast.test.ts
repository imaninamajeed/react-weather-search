import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/forecast-subang-jaya.json";
import { forecastResponseSchema, normalizeForecast } from "./forecast";

const parse = () => forecastResponseSchema.parse(structuredClone(fixture));

describe("normalizeForecast", () => {
  it("normalizes a real Open-Meteo response", () => {
    const forecast = normalizeForecast(parse());

    expect(forecast.timezone).toBe("Asia/Kuala_Lumpur");
    expect(forecast.utcOffsetSeconds).toBe(28800);
    expect(forecast.hourly).toHaveLength(72);
    expect(forecast.daily).toHaveLength(14);

    expect(forecast.current).toMatchObject({
      time: "2026-10-27T00:45",
      isDay: false,
      weatherCode: 51,
      temperature: 23.9,
      humidity: 97,
      windSpeed: 2.8,
      windGusts: 7.6,
      visibility: 4060,
    });
    expect(forecast.daily[0].date).toBe("2026-10-27");
    expect(forecast.daily[0].sunrise).toMatch(/^2026-10-27T\d\d:\d\d$/);
    expect(forecast.hourly[0].time).toBe("2026-10-27T00:00");
  });

  it("keeps wall-clock strings untouched (no timezone conversion)", () => {
    const forecast = normalizeForecast(parse());
    expect(forecast.hourly.every((h) => /^\d{4}-\d\d-\d\dT\d\d:00$/.test(h.time))).toBe(true);
  });

  it("degrades optional measurements to 0 but rejects missing essentials", () => {
    const raw = parse();
    raw.current.uv_index = null;
    raw.hourly.precipitation_probability[3] = null;
    const forecast = normalizeForecast(raw);
    expect(forecast.current.uvIndex).toBe(0);
    expect(forecast.hourly[3].precipitationProbability).toBe(0);

    const broken = parse();
    broken.current.temperature_2m = null;
    expect(() => normalizeForecast(broken)).toThrow("missing current.temperature_2m");

    const brokenDaily = parse();
    brokenDaily.daily.temperature_2m_max[2] = null;
    expect(() => normalizeForecast(brokenDaily)).toThrow("daily.temperature_2m_max[2]");
  });

  it("handles polar days with no sunrise or sunset", () => {
    const raw = parse();
    raw.daily.sunrise[0] = null;
    raw.daily.sunset[0] = null;
    const forecast = normalizeForecast(raw);
    expect(forecast.daily[0].sunrise).toBe("2026-10-27T00:00");
  });

  it("rejects a response with the wrong shape", () => {
    const raw = structuredClone(fixture) as Record<string, unknown>;
    delete raw.daily;
    expect(forecastResponseSchema.safeParse(raw).success).toBe(false);
  });
});
