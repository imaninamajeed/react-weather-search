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
    expect(formatPlaceSubtitle({ name: "Pin", region: "Dropped Pin" })).toBe("Dropped Pin");
  });
});

import { formatHourRange } from "./format";

describe("formatHourRange", () => {
  it("collapses the meridiem when both ends share it", () => {
    expect(formatHourRange("2026-10-27T15:00", "2026-10-27T17:00")).toBe("3–6 PM");
    expect(formatHourRange("2026-10-27T00:00", "2026-10-27T09:00")).toBe("12–10 AM");
  });

  it("spells out both when the range crosses noon or midnight", () => {
    expect(formatHourRange("2026-10-27T11:00", "2026-10-27T13:00")).toBe("11 AM–2 PM");
    expect(formatHourRange("2026-10-27T22:00", "2026-10-27T23:00")).toBe("10 PM–12 AM");
  });

  it("covers a single hour", () => {
    expect(formatHourRange("2026-10-27T14:00", "2026-10-27T14:00")).toBe("2–3 PM");
  });
});

import { formatUtcOffset } from "./format";

describe("formatUtcOffset", () => {
  it("formats whole and fractional offsets", () => {
    expect(formatUtcOffset(28800)).toBe("UTC+8");
    expect(formatUtcOffset(19800)).toBe("UTC+5:30");
    expect(formatUtcOffset(-10800)).toBe("UTC−3");
    expect(formatUtcOffset(0)).toBe("UTC+0");
  });
});

import { addDays, addHours, isoToWallClock } from "./format";

describe("isoToWallClock", () => {
  it("shows the same instant as wall-clock time in the requested zone", () => {
    const instant = "2026-10-26T12:36:00-04:00"; // 16:36 UTC
    expect(isoToWallClock(instant, "America/New_York")).toBe("2026-10-26T12:36");
    expect(isoToWallClock(instant, "UTC")).toBe("2026-10-26T16:36");
    expect(isoToWallClock(instant, "Asia/Tokyo")).toBe("2026-10-27T01:36");
    expect(isoToWallClock("2026-10-26T16:00:00Z", "Asia/Kolkata")).toBe("2026-10-26T21:30");
  });

  it("never renders midnight as hour 24", () => {
    expect(isoToWallClock("2026-10-26T16:00:00Z", "Asia/Kuala_Lumpur")).toBe("2026-10-27T00:00");
  });

  it("rejects garbage", () => {
    expect(() => isoToWallClock("soon", "UTC")).toThrow(RangeError);
  });
});

describe("addDays / addHours", () => {
  it("rolls over months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01T08:30", -1)).toBe("2026-02-28T08:30");
  });

  it("adds hours across midnight", () => {
    expect(addHours("2026-10-27T23:00", 1)).toBe("2026-10-28T00:00");
    expect(addHours("2026-10-27T10:00", 3)).toBe("2026-10-27T13:00");
  });
});
