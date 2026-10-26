import { describe, expect, it } from "vitest";
import byId from "@/test/fixtures/geocoding-subang-jaya.json";
import search from "@/test/fixtures/geocoding-tokyo.json";
import { toPlace } from "./geocoding";
import { normalizeQuery } from "./geocoding-query";

describe("toPlace", () => {
  it("maps a geocoding result to a Place with a stable key", () => {
    expect(toPlace(byId)).toEqual({
      key: "8504423-subang-jaya",
      name: "Subang Jaya",
      region: "Selangor",
      country: "Malaysia",
      countryCode: "MY",
      latitude: 3.04384,
      longitude: 101.58062,
      timezone: "Asia/Kuala_Lumpur",
    });
  });

  it("keeps same-named places distinguishable by key and region", () => {
    const [tokyoJapan, tokyoPng] = search.results.map(toPlace);
    expect(tokyoJapan.key).not.toBe(tokyoPng.key);
    expect(tokyoJapan.countryCode).toBe("JP");
    expect(tokyoPng.countryCode).not.toBe("JP");
  });
});

describe("normalizeQuery", () => {
  it("trims, collapses whitespace and clamps length", () => {
    expect(normalizeQuery("  New   York ")).toBe("New York");
    expect(normalizeQuery("x".repeat(200))).toHaveLength(80);
  });
});
