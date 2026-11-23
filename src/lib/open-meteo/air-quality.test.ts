import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/air-quality-subang-jaya.json";
import { normalizeAirQuality } from "./air-quality";

describe("normalizeAirQuality", () => {
  it("normalizes current readings", () => {
    expect(normalizeAirQuality(fixture)).toEqual({
      time: "2026-10-27T01:00",
      usAqi: 96,
      pm25: 27.8,
      pm10: 27.9,
      ozone: 0,
      nitrogenDioxide: 91.8,
    });
  });

  it("returns null where there is no AQI coverage", () => {
    expect(normalizeAirQuality({ current: { ...fixture.current, us_aqi: null } })).toBeNull();
  });
});
