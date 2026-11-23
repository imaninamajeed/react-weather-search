import { describe, expect, it } from "vitest";
import { dewPointComfort, pressureLevel } from "./comfort";

describe("dewPointComfort", () => {
  it.each([
    [-5, "dry"],
    [9.9, "dry"],
    [10, "comfortable"],
    [15.9, "comfortable"],
    [16, "sticky"],
    [20, "muggy"],
    [23.9, "muggy"],
    [24, "oppressive"],
    [27, "oppressive"],
  ] as const)("%s °C is %s", (dewPoint, level) => {
    expect(dewPointComfort(dewPoint)).toBe(level);
  });
});

describe("pressureLevel", () => {
  it.each([
    [985, "low"],
    [999.9, "low"],
    [1000, "normal"],
    [1013, "normal"],
    [1022, "normal"],
    [1022.1, "high"],
    [1035, "high"],
  ] as const)("%s hPa is %s", (pressure, level) => {
    expect(pressureLevel(pressure)).toBe(level);
  });
});
