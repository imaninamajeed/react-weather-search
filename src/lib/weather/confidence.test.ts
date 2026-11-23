import { describe, expect, it } from "vitest";
import london from "@/test/fixtures/models-london.json";
import subang from "@/test/fixtures/models-subang-jaya.json";
import { normalizeModelDays } from "@/lib/open-meteo/models";
import { assessConfidence, assessDay, summarizeConfidence, type ModelDay } from "./confidence";

const day = (
  temps: [number?, number?, number?],
  rain: [number?, number?, number?],
  date = "2026-10-27",
): ModelDay => {
  const ids = ["ecmwf_ifs025", "gfs_seamless", "icon_seamless"] as const;
  const pick = (values: Array<number | undefined>) =>
    Object.fromEntries(ids.flatMap((id, i) => (values[i] === undefined ? [] : [[id, values[i]]])));
  return { date, temperatureMax: pick(temps), precipitation: pick(rain) };
};

describe("assessDay", () => {
  it("is high when highs agree and rain is consistent", () => {
    expect(assessDay(day([30, 31, 30.5], [5, 6, 4])).level).toBe("high");
    expect(assessDay(day([30, 32, 31], [0, 0, 0])).level).toBe("high"); // spread exactly 2
  });

  it("steps down with temperature spread", () => {
    expect(assessDay(day([30, 32.5, 31], [0, 0, 0])).level).toBe("medium");
    expect(assessDay(day([30, 33.5, 31], [0, 0, 0])).level).toBe("medium"); // spread exactly 3.5
    expect(assessDay(day([30, 34, 31], [0, 0, 0])).level).toBe("low");
  });

  it("drops one step when models split on wet vs dry", () => {
    const split = assessDay(day([30, 30.5, 31], [0, 0.5, 4]));
    expect(split.rainSplit).toBe(true);
    expect(split.level).toBe("medium");
    // Trace amounts on both sides of the dry line are not a real disagreement.
    expect(assessDay(day([30, 30.5, 31], [0.5, 1.5, 1.2])).rainSplit).toBe(false);
  });

  it("drops one step when rain amounts differ widely", () => {
    const wide = assessDay(day([30, 30.5, 31], [14.5, 110.4, 5.7]));
    expect(wide.rainAmountSplit).toBe(true);
    expect(wide.level).toBe("medium");
    expect(assessDay(day([30, 30.5, 31], [6.9, 12.1, 13.7])).rainAmountSplit).toBe(false);
  });

  it("never drops below low", () => {
    expect(assessDay(day([20, 30, 25], [0, 50, 5])).level).toBe("low");
  });

  it("needs at least two models", () => {
    expect(assessDay(day([30], [1])).level).toBeNull();
    expect(assessDay(day([], [])).level).toBeNull();
    expect(assessDay(day([30, undefined, 31], [1, undefined, 1])).level).toBe("high");
  });
});

describe("normalizeModelDays", () => {
  it("reads the suffixed keys of a real multi-model response", () => {
    const days = normalizeModelDays(subang);
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({
      date: "2026-10-27",
      temperatureMax: { ecmwf_ifs025: 29.8, gfs_seamless: 31.5, icon_seamless: 30.3 },
      precipitation: { ecmwf_ifs025: 10.9, gfs_seamless: 8.2, icon_seamless: 9.4 },
    });
  });

  it("omits models that have no value for a day", () => {
    const raw = structuredClone(london);
    (raw.daily.temperature_2m_max_icon_seamless as Array<number | null>)[2] = null;
    expect(normalizeModelDays(raw)[2].temperatureMax).not.toHaveProperty("icon_seamless");
  });
});

describe("with real model output", () => {
  const today = "2026-10-27";

  it("rates London high early and less certain late", () => {
    // London's local date is a day behind Subang Jaya's, so its week starts on Oct 26.
    const days = assessConfidence(normalizeModelDays(london));
    expect(days.map((d) => d.level)).toEqual([
      "high",
      "high",
      "high",
      "high",
      "high",
      "medium",
      "medium",
    ]);
    expect(summarizeConfidence(days, "metric", "2026-10-26")).toBe(
      "The models agree closely through Fri Oct 30, then start to diverge.",
    );
  });

  it("flags the 110 mm outlier in the Subang Jaya forecast", () => {
    const days = assessConfidence(normalizeModelDays(subang));
    expect(days[3]).toMatchObject({ rainAmountSplit: true });
    const text = summarizeConfidence(days, "metric", today);
    expect(text).toContain("GFS expects 110 mm of rain Fri Oct 30");
    expect(text).toContain("far more than the other models (5.7 mm to 15 mm)");
  });
});

describe("summarizeConfidence", () => {
  const today = "2026-10-27";
  const week = (levels: Array<[number, number]>) =>
    assessConfidence(
      levels.map(([a, b], i) => day([30, 30 + a, 30 + b], [0, 0, 0], `2026-10-${27 + i}`)),
    );

  it("handles every shape", () => {
    expect(
      summarizeConfidence(
        week([
          [1, 1],
          [1, 1],
        ]),
        "metric",
        today,
      ),
    ).toBe("The models agree closely all week.");
    expect(
      summarizeConfidence(
        week([
          [1, 1],
          [1, 3],
        ]),
        "metric",
        today,
      ),
    ).toBe("The models agree closely through today, then start to diverge.");
    expect(
      summarizeConfidence(
        week([
          [1, 1],
          [1, 1],
          [1, 3],
        ]),
        "metric",
        today,
      ),
    ).toBe("The models agree closely through tomorrow, then start to diverge.");
    expect(summarizeConfidence(week([[1, 3]]), "metric", today)).toBe(
      "The models are only loosely aligned, even for today.",
    );
    expect(summarizeConfidence(week([[1, 5]]), "metric", today)).toBe(
      "The models disagree noticeably even about today, so treat the details as uncertain.",
    );
  });

  it("says so when there is nothing to compare", () => {
    expect(summarizeConfidence(assessConfidence([day([30], [1])]), "metric", today)).toContain(
      "isn't enough model data",
    );
  });

  it("states rainfall in the viewer's units", () => {
    const days = assessConfidence([day([30, 30, 30], [100, 5, 8])]);
    expect(summarizeConfidence(days, "imperial", today)).toContain("3.94 in");
  });
});
