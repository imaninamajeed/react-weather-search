import { describe, expect, it } from "vitest";
import { temperatureColor, temperatureGradient } from "./temperature-color";

const parse = (color: string) =>
  color
    .match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)!
    .slice(1)
    .map(Number);

describe("temperatureColor", () => {
  it("clamps outside the ramp", () => {
    expect(temperatureColor(-40)).toBe(temperatureColor(-10));
    expect(temperatureColor(60)).toBe(temperatureColor(40));
  });

  it("hits stops exactly", () => {
    expect(temperatureColor(18)).toBe("oklch(0.820 0.130 170.0)");
  });

  it("interpolates the hue along the shorter arc through red", () => {
    // 35 °C (h 35) → 40 °C (h 355): midpoint should be near 15°, not 195°.
    const [, , hue] = parse(temperatureColor(37.5));
    expect(hue).toBeGreaterThan(5);
    expect(hue).toBeLessThan(25);
  });

  it("builds a gradient covering the range", () => {
    const gradient = temperatureGradient(20, 32, 3);
    expect(gradient.startsWith("linear-gradient(to right,")).toBe(true);
    expect(gradient.match(/oklch/g)).toHaveLength(3);
    expect(gradient).toContain("0%");
    expect(gradient).toContain("100%");
  });
});
