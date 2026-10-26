import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatHour,
  formatPlaceSubtitle,
  formatTime,
  formatWeekday,
  formatWeekdayClock,
  minutesOfDay,
} from "./format";

// Regression tests for the original app's timezone bug: wall-clock strings must be
// printed as-is, never shifted into the server's or viewer's timezone.
describe("format", () => {
  it("prints wall-clock times without timezone shifts", () => {
    expect(formatWeekdayClock("2026-10-27T00:45")).toBe("Tuesday 00:45");
    expect(formatWeekdayClock("2026-10-27T23:59")).toBe("Tuesday 23:59");
    expect(formatHour("2026-10-27T15:00")).toBe("3 PM");
    expect(formatTime("2026-10-27T06:12")).toBe("6:12 AM");
  });

  it("derives weekday from the date string itself", () => {
    expect(formatWeekday("2026-10-27")).toBe("Tue");
    expect(formatWeekday("2026-10-31", "long")).toBe("Saturday");
    expect(formatWeekday("2026-12-31")).toBe("Thu");
  });

  it("formats durations", () => {
    expect(formatDuration(43500)).toBe("12h 05m");
    expect(formatDuration(0)).toBe("0h 00m");
  });

  it("reads minutes of day", () => {
    expect(minutesOfDay("2026-10-27T06:30")).toBe(390);
  });

  it("skips a region that repeats the place name", () => {
    expect(formatPlaceSubtitle({ name: "Tokyo", region: "Tokyo", country: "Japan" })).toBe("Japan");
    expect(
      formatPlaceSubtitle({ name: "Subang Jaya", region: "Selangor", country: "Malaysia" }),
    ).toBe("Selangor, Malaysia");
    expect(formatPlaceSubtitle({ name: "Pin", region: "Dropped pin" })).toBe("Dropped pin");
  });
});
