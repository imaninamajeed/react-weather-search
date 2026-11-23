import { describe, expect, it } from "vitest";
import {
  coordinateKey,
  coordinateLabel,
  geocodedKey,
  parsePlaceKey,
  placeFromCoordinates,
  placeHref,
  roundCoordinate,
  slugify,
} from "./places";

describe("slugify", () => {
  it("lowercases, strips diacritics and punctuation", () => {
    expect(slugify("Subang Jaya")).toBe("subang-jaya");
    expect(slugify("São Paulo")).toBe("sao-paulo");
    expect(slugify("  Kuala  Lumpur!! ")).toBe("kuala-lumpur");
  });

  it("falls back for names with no latin characters", () => {
    expect(slugify("東京")).toBe("place");
  });

  it("caps length without leaving a trailing dash", () => {
    const slug = slugify("a".repeat(39) + " bbb");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("parsePlaceKey", () => {
  it("parses geocoded keys", () => {
    expect(parsePlaceKey("8504423-subang-jaya")).toEqual({
      kind: "geocoded",
      id: 8504423,
      slug: "subang-jaya",
    });
    expect(parsePlaceKey("1850147")).toEqual({ kind: "geocoded", id: 1850147, slug: "" });
  });

  it("parses coordinate keys, including encoded commas and negatives", () => {
    expect(parsePlaceKey("3.04,101.58")).toEqual({
      kind: "coordinates",
      latitude: 3.04,
      longitude: 101.58,
    });
    expect(parsePlaceKey("-33.87%2C151.21")).toEqual({
      kind: "coordinates",
      latitude: -33.87,
      longitude: 151.21,
    });
  });

  it.each([
    "",
    "abc",
    "0-zero",
    "91,10",
    "10,181",
    "1.2.3,4",
    "3.04,101.58,5",
    "8504423-Bad_Slug",
    "%E0%A4%A",
    "../etc/passwd",
  ])("rejects %j", (key) => {
    expect(parsePlaceKey(key)).toBeNull();
  });
});

describe("place keys", () => {
  it("builds canonical keys", () => {
    expect(geocodedKey(8504423, "Subang Jaya")).toBe("8504423-subang-jaya");
    expect(coordinateKey(3.04384, 101.58062)).toBe("3.04,101.58");
    expect(roundCoordinate(3.045)).toBe(3.05);
  });

  it("labels coordinates by hemisphere", () => {
    expect(coordinateLabel(3.04384, 101.58062)).toBe("3.04°N, 101.58°E");
    expect(coordinateLabel(-33.868, -70.1)).toBe("33.87°S, 70.1°W");
  });

  it("creates a place from a dropped pin", () => {
    expect(placeFromCoordinates(3.04384, 101.58062)).toMatchObject({
      key: "3.04,101.58",
      name: "3.04°N, 101.58°E",
      region: "Dropped Pin",
    });
    expect(placeHref({ key: "3.04,101.58" })).toBe("/place/3.04%2C101.58");
  });
});
