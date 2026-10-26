import { describe, expect, it } from "vitest";
import { describeWeather, isPrecipitation, isThunderstorm } from "./codes";

describe("weather codes", () => {
  it("picks day or night icons", () => {
    expect(describeWeather(0, true)).toEqual({ label: "Clear sky", icon: "clear-day" });
    expect(describeWeather(0, false).icon).toBe("clear-night");
    expect(describeWeather(2, false).icon).toBe("partly-cloudy-night");
  });

  it("uses the same icon at night when there is no night variant", () => {
    expect(describeWeather(63, false).icon).toBe("rain");
  });

  it("degrades gracefully for unknown codes", () => {
    expect(describeWeather(1234)).toEqual({ label: "Unknown conditions", icon: "cloudy" });
  });

  it("classifies storms and precipitation", () => {
    expect([95, 96, 99].every(isThunderstorm)).toBe(true);
    expect(isThunderstorm(63)).toBe(false);
    expect(isPrecipitation(61)).toBe(true);
    expect(isPrecipitation(95)).toBe(true);
    expect(isPrecipitation(45)).toBe(false);
    expect(isPrecipitation(3)).toBe(false);
  });
});
