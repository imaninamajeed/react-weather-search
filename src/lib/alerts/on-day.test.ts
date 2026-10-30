import { describe, expect, it } from "vitest";
import { severityOnDay } from "./on-day";
import type { ForecastHazard, OfficialAlert } from "./types";

const hazard = (
  start: string,
  end: string,
  severity: ForecastHazard["severity"],
): ForecastHazard => ({
  source: "forecast",
  id: `${start}-${severity}`,
  kind: "rain",
  severity,
  granularity: "hour",
  start,
  end,
  peak: 1,
  metric: "probability",
});

const official = (starts: string | null, ends: string | null): OfficialAlert => ({
  source: "nws",
  id: "o",
  severity: "warning",
  kind: "other",
  title: "t",
  text: "t",
  starts,
  ends,
  issuer: "i",
  url: "u",
});

describe("severityOnDay", () => {
  it("covers every day from start to end, and none outside", () => {
    const alerts = [hazard("2026-10-31T18:00", "2026-11-01T06:00", "advisory")];
    expect(severityOnDay(alerts, "2026-10-30", "2026-10-31")).toBeNull();
    expect(severityOnDay(alerts, "2026-10-31", "2026-10-31")).toBe("advisory");
    expect(severityOnDay(alerts, "2026-11-01", "2026-10-31")).toBe("advisory");
    expect(severityOnDay(alerts, "2026-11-02", "2026-10-31")).toBeNull();
  });

  it("reports the most serious alert on a shared day", () => {
    const alerts = [
      hazard("2026-10-31T01:00", "2026-10-31T05:00", "advisory"),
      hazard("2026-10-31T09:00", "2026-10-31T12:00", "warning"),
    ];
    expect(severityOnDay(alerts, "2026-10-31", "2026-10-31")).toBe("warning");
  });

  it("treats a missing start as already begun and a missing end as one day", () => {
    expect(severityOnDay([official(null, null)], "2026-10-31", "2026-10-31")).toBe("warning");
    expect(severityOnDay([official(null, null)], "2026-11-01", "2026-10-31")).toBeNull();
    expect(severityOnDay([official(null, "2026-11-02T00:00")], "2026-11-01", "2026-10-31")).toBe(
      "warning",
    );
  });
});
