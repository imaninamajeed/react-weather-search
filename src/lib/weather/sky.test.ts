import { describe, expect, it } from "vitest";
import { precipitationFor, SKY_PALETTES, skyPreset, skyScene } from "./sky";

const today = { sunrise: "2026-10-27T06:56", sunset: "2026-10-27T18:58" };
const at = (time: string, weatherCode: number, isDay: boolean, cloudCover = 0) => ({
  time: `2026-10-27T${time}`,
  weatherCode,
  isDay,
  cloudCover,
});

describe("skyScene", () => {
  it("paints a clear midday sky with the sun", () => {
    expect(skyScene(at("12:00", 0, true), today)).toEqual({
      palette: "clear-day",
      glow: "sun",
      clouds: 0,
      precipitation: null,
      lightning: false,
      stars: false,
    });
  });

  it("turns golden within an hour of sunrise or sunset, and not beyond", () => {
    expect(skyScene(at("07:30", 1, true), today).palette).toBe("golden");
    expect(skyScene(at("18:00", 2, true, 30), today).palette).toBe("golden");
    expect(skyScene(at("05:56", 0, true), today).palette).toBe("golden");
    expect(skyScene(at("08:00", 0, true), today).palette).toBe("clear-day");
    expect(skyScene(at("17:57", 0, true), today).palette).toBe("clear-day");
  });

  it("shows the moon and stars on a clear night", () => {
    const night = skyScene(at("00:45", 0, false), today);
    expect(night).toMatchObject({ palette: "clear-night", glow: "moon", stars: true });
  });

  it("lets a storm win over the night", () => {
    const storm = skyScene(at("00:45", 95, false, 100), today);
    expect(storm).toMatchObject({ palette: "storm", lightning: true, clouds: 3 });
    expect(storm.precipitation).toEqual({ kind: "rain", intensity: 3 });
    expect(skyScene(at("12:00", 99, true), today).precipitation).toEqual({
      kind: "hail",
      intensity: 3,
    });
  });

  it("puts snow before rain, and rain before fog", () => {
    expect(skyScene(at("12:00", 73, true), today).palette).toBe("snow");
    expect(skyScene(at("12:00", 63, true), today).palette).toBe("rain-day");
    expect(skyScene(at("00:45", 51, false, 99), today).palette).toBe("rain-night");
    expect(skyScene(at("12:00", 45, true), today)).toMatchObject({ palette: "fog", clouds: 0 });
  });

  it("never draws rain from a clear sky", () => {
    expect(skyScene(at("12:00", 61, true, 5), today).clouds).toBe(2);
  });

  it("covers an overcast sky by day and by night", () => {
    expect(skyScene(at("12:00", 3, true, 100), today).palette).toBe("overcast-day");
    expect(skyScene(at("22:00", 3, false, 100), today).palette).toBe("overcast-night");
  });

  it("maps cloud cover to layers, with at least one for partly cloudy", () => {
    expect(skyScene(at("12:00", 0, true, 10), today).clouds).toBe(0);
    expect(skyScene(at("12:00", 1, true, 40), today).clouds).toBe(1);
    expect(skyScene(at("12:00", 2, true, 0), today).clouds).toBe(1);
    expect(skyScene(at("12:00", 2, true, 70), today).clouds).toBe(2);
  });

  it("degrades gracefully without sun times or for unknown codes", () => {
    expect(skyScene(at("07:00", 0, true), undefined).palette).toBe("clear-day");
    expect(skyScene(at("07:00", 0, true), { sunrise: "", sunset: "" }).palette).toBe("clear-day");
    // An unknown code shows a plain cloud icon, so the sky is overcast to match.
    expect(skyScene(at("12:00", 1234, true, 10), today).palette).toBe("overcast-day");
  });
});

describe("precipitationFor", () => {
  it("grades drizzle, rain and snow by intensity", () => {
    expect(precipitationFor(51)).toEqual({ kind: "drizzle", intensity: 1 });
    expect(precipitationFor(65)).toEqual({ kind: "rain", intensity: 3 });
    expect(precipitationFor(81)).toEqual({ kind: "rain", intensity: 2 });
    expect(precipitationFor(75)).toEqual({ kind: "snow", intensity: 3 });
    expect(precipitationFor(2)).toBeNull();
  });
});

describe("skyPreset", () => {
  it("gives every palette a scene of its own", () => {
    for (const palette of SKY_PALETTES) expect(skyPreset(palette).palette).toBe(palette);
    expect(skyPreset("storm").lightning).toBe(true);
    expect(skyPreset("clear-night").stars).toBe(true);
  });
});
