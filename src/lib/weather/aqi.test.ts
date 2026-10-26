import { describe, expect, it } from "vitest";
import { aqiCategory } from "./aqi";

describe("aqiCategory", () => {
  it.each([
    [0, "Good", 0],
    [50, "Good", 0],
    [51, "Moderate", 1],
    [96, "Moderate", 1],
    [150, "Unhealthy for sensitive groups", 2],
    [151, "Unhealthy", 3],
    [201, "Very unhealthy", 4],
    [301, "Hazardous", 5],
  ])("AQI %i is %s", (aqi, label, level) => {
    expect(aqiCategory(aqi)).toMatchObject({ label, level });
  });
});
