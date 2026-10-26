import { describe, expect, it } from "vitest";
import raw from "@/test/fixtures/nws-alerts-sample.json";
import { normalizeNwsAlerts, type NwsResponse } from "./nws";

const sample = raw as unknown as NwsResponse;

describe("normalizeNwsAlerts", () => {
  const alerts = normalizeNwsAlerts(sample, "America/New_York", 28.54, -81.38);

  it("maps real NWS alerts", () => {
    expect(alerts.map((a) => [a.title, a.severity, a.kind])).toEqual([
      ["Wind Advisory", "advisory", "wind"],
      ["Flood Warning", "warning", "rain"],
      ["Rip Current Statement", "advisory", "other"],
    ]);
    expect(alerts[0]).toMatchObject({
      source: "nws",
      issuer: "NWS Melbourne FL",
      url: "https://forecast.weather.gov/MapClick.php?lat=28.54&lon=-81.38",
    });
    expect(alerts[0].text.length).toBeGreaterThan(20);
  });

  it("converts offset timestamps into the place's wall-clock time", () => {
    // 12:36 EDT on the 26th, in the place's own zone and then in Tokyo.
    expect(alerts[0].starts).toBe("2026-10-26T12:36");
    expect(alerts[0].ends).toBe("2026-10-27T08:00");
    expect(normalizeNwsAlerts(sample, "Asia/Tokyo", 0, 0)[0].starts).toBe("2026-10-27T01:36");
  });

  it("drops cancellations and test messages", () => {
    const base = sample.features[0].properties;
    const make = (overrides: object): NwsResponse => ({
      features: [{ properties: { ...base, ...overrides } }],
    });
    expect(normalizeNwsAlerts(make({ messageType: "Cancel" }), "UTC", 0, 0)).toEqual([]);
    expect(normalizeNwsAlerts(make({ status: "Test" }), "UTC", 0, 0)).toEqual([]);
  });

  it("treats Severe/Extreme as warnings even without 'Warning' in the name", () => {
    const base = sample.features[0].properties;
    const result = normalizeNwsAlerts(
      {
        features: [
          { properties: { ...base, event: "Special Weather Statement", severity: "Severe" } },
        ],
      },
      "UTC",
      0,
      0,
    );
    expect(result[0].severity).toBe("warning");
  });
});
