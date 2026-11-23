import { describe, expect, it } from "vitest";
import {
  compassPoint,
  convertTemperature,
  formatDistance,
  formatPrecipitation,
  formatPressure,
  formatSpeed,
  formatTemperature,
} from "./units";

describe("units", () => {
  it("converts temperature", () => {
    expect(convertTemperature(0, "imperial")).toBe(32);
    expect(convertTemperature(100, "imperial")).toBe(212);
    expect(convertTemperature(21.5, "metric")).toBe(21.5);
  });

  it("formats values with the right unit", () => {
    expect(formatTemperature(28.6, "metric")).toBe("29°");
    expect(formatTemperature(28.6, "imperial")).toBe("83°");
    expect(formatSpeed(100, "metric")).toBe("100 km/h");
    expect(formatSpeed(100, "imperial")).toBe("62 mph");
    expect(formatPrecipitation(2.54, "imperial")).toBe("0.10 in");
    expect(formatPrecipitation(2.54, "metric")).toBe("2.5 mm");
    expect(formatPrecipitation(35.2, "metric")).toBe("35 mm");
    expect(formatPressure(1013.25, "metric")).toBe("1013 hPa");
    expect(formatPressure(1013.25, "imperial")).toBe("29.92 inHg");
    expect(formatDistance(4060, "metric")).toBe("4.1 km");
    expect(formatDistance(24000, "metric")).toBe("24 km");
  });

  it("maps degrees to compass points, wrapping at north", () => {
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(359)).toBe("N");
    expect(compassPoint(40)).toBe("NE");
    expect(compassPoint(180)).toBe("S");
    expect(compassPoint(-90)).toBe("W");
  });
});
