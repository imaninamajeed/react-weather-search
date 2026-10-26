import { describe, expect, it } from "vitest";
import { minutesBeforeLatest, normalizeRadar, radarResponseSchema, radarTileUrl } from "./radar";
import { parseCoordinates } from "./point";

const sample = {
  version: "2.0",
  generated: 1793037000,
  host: "https://tilecache.rainviewer.com",
  radar: {
    past: [
      { time: 1793036400, path: "/v2/radar/55324b8cc5b2" },
      { time: 1793029200, path: "/v2/radar/11b2ceae0242" },
      { time: 1793032800, path: "/v2/radar/aaaaaaaaaaaa" },
    ],
    nowcast: [],
  },
};

describe("radar", () => {
  it("parses the real feed shape and orders frames oldest first", () => {
    const radar = normalizeRadar(radarResponseSchema.parse(sample));
    expect(radar.frames.map((f) => f.time)).toEqual([1793029200, 1793032800, 1793036400]);
    expect(radar.host).toBe("https://tilecache.rainviewer.com");
  });

  it("builds tile URLs MapLibre can fill in", () => {
    expect(radarTileUrl("https://tilecache.rainviewer.com", "/v2/radar/abc123")).toBe(
      "https://tilecache.rainviewer.com/v2/radar/abc123/256/{z}/{x}/{y}/2/1_1.png",
    );
  });

  it("refuses hosts and paths that could redirect tile requests elsewhere", () => {
    const parse = (override: object) =>
      radarResponseSchema.safeParse({ ...sample, ...override }).success;
    expect(parse({})).toBe(true);
    expect(parse({ host: "https://evil.example.com" })).toBe(false);
    expect(parse({ host: "http://tilecache.rainviewer.com" })).toBe(false);
    expect(parse({ host: "https://tilecache.rainviewer.com.evil.com" })).toBe(false);
    expect(parse({ radar: { past: [{ time: 1, path: "/v2/radar/../../etc" }] } })).toBe(false);
    expect(parse({ radar: { past: [{ time: 1, path: "https://evil.example.com/x" }] } })).toBe(
      false,
    );
  });

  it("measures how far a frame is behind the latest", () => {
    const { frames } = normalizeRadar(radarResponseSchema.parse(sample));
    expect(minutesBeforeLatest(frames, 2)).toBe(0);
    expect(minutesBeforeLatest(frames, 1)).toBe(60);
    expect(minutesBeforeLatest(frames, 0)).toBe(120);
    expect(minutesBeforeLatest([], 0)).toBe(0);
  });
});

describe("parseCoordinates", () => {
  it("accepts valid pairs", () => {
    expect(parseCoordinates("3.04", "101.58")).toEqual({ latitude: 3.04, longitude: 101.58 });
    expect(parseCoordinates("-33.87", "-151.2")).toEqual({ latitude: -33.87, longitude: -151.2 });
  });

  it.each([
    [null, "1"],
    ["1", null],
    ["", "1"],
    ["abc", "1"],
    ["91", "0"],
    ["0", "181"],
    ["NaN", "0"],
    ["Infinity", "0"],
    ["1".repeat(40), "1"],
  ])("rejects %j, %j", (lat, lon) => {
    expect(parseCoordinates(lat, lon)).toBeNull();
  });
});
