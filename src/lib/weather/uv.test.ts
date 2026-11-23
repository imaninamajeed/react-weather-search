import { describe, expect, it } from "vitest";
import { uvCategory, uvProtectionWindow } from "./uv";
import type { HourlyPoint } from "./types";

const point = (time: string, uvIndex: number) => ({ time, uvIndex }) as HourlyPoint;

describe("uv", () => {
  it.each([
    [0, "Low"],
    [2.9, "Low"],
    [3, "Moderate"],
    [6, "High"],
    [8, "Very High"],
    [11, "Extreme"],
  ])("UV %s is %s", (uv, label) => {
    expect(uvCategory(uv).label).toBe(label);
  });

  it("finds the protection window for the rest of today only", () => {
    const hourly = [
      point("2026-10-27T10:00", 3.9),
      point("2026-10-27T11:00", 5.7),
      point("2026-10-27T12:00", 7.7),
      point("2026-10-27T13:00", 2.1),
      point("2026-10-28T11:00", 6), // tomorrow: excluded
    ];
    expect(uvProtectionWindow(hourly, "2026-10-27T09:30")).toEqual({
      first: "2026-10-27T10:00",
      last: "2026-10-27T12:00",
    });
  });

  it("returns null when UV stays low", () => {
    expect(uvProtectionWindow([point("2026-10-27T20:00", 0)], "2026-10-27T20:15")).toBeNull();
  });
});
