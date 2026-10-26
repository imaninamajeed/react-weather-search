import { describe, expect, it } from "vitest";
import raw from "@/test/fixtures/met-malaysia-warnings.json";
import { DEFAULT_PLACE, type Place } from "@/lib/places";
import { matchMetWarnings, type MetWarning } from "./met-malaysia";

const real = raw as MetWarning[];
const NOW = "2026-10-27T01:15";

const place = (overrides: Partial<Place>): Place => ({ ...DEFAULT_PLACE, ...overrides });
const warning = (text: string, overrides: Partial<MetWarning> = {}): MetWarning => ({
  warning_issue: { issued: "2026-10-27T00:55:00", title_en: "Thunderstorms Warning" },
  valid_from: "2026-10-27T00:00:00",
  valid_to: "2026-10-27T05:00:00",
  heading_en: "THUNDERSTORMS WARNING",
  text_en: text,
  instruction_en: null,
  ...overrides,
});

describe("matchMetWarnings with the real feed", () => {
  it("ignores marine bulletins, expired warnings and the 'No Advisory' placeholder", () => {
    // The live feed holds a Sarawak thunderstorm warning plus marine "waters of Selangor" bulletins.
    expect(matchMetWarnings(DEFAULT_PLACE, real, NOW)).toEqual([]);
  });

  it("matches a Sarawak place named in the district list", () => {
    const mukah = place({ name: "Mukah", region: "Sarawak", district: "Bahagian Mukah" });
    const [alert] = matchMetWarnings(mukah, real, NOW);
    expect(alert).toMatchObject({
      source: "met-malaysia",
      kind: "thunderstorm",
      severity: "warning",
      title: "Thunderstorms Warning",
      starts: "2026-10-27T00:00",
      ends: "2026-10-27T05:00",
      issuer: "MET Malaysia",
    });
    expect(alert.text).toContain("Mukah");
  });

  it("does not match another Sarawak place that the list omits", () => {
    const kuching = place({ name: "Kuching", region: "Sarawak", district: "Bahagian Kuching" });
    expect(matchMetWarnings(kuching, real, NOW)).toEqual([]);
  });

  it("stops matching once the warning has expired", () => {
    const mukah = place({ name: "Mukah", region: "Sarawak" });
    expect(matchMetWarnings(mukah, real, "2026-10-27T05:00")).toEqual([]);
    expect(matchMetWarnings(mukah, real, "2026-10-27T04:59")).toHaveLength(1);
  });
});

describe("matchMetWarnings matching rules", () => {
  it("treats a state without a district list as state-wide", () => {
    const text = "Thunderstorms are expected over the states of Selangor • Perak until 5:00 AM.";
    expect(matchMetWarnings(DEFAULT_PLACE, [warning(text)], NOW)).toHaveLength(1);
  });

  it("only matches listed districts when the state has a list", () => {
    const listed =
      "Thunderstorms are expected over the states of Selangor (Petaling, Klang) • Pahang until 5:00 AM.";
    const other =
      "Thunderstorms are expected over the states of Selangor (Hulu Langat, Sepang) until 5:00 AM.";
    expect(matchMetWarnings(DEFAULT_PLACE, [warning(listed)], NOW)).toHaveLength(1);
    expect(matchMetWarnings(DEFAULT_PLACE, [warning(other)], NOW)).toEqual([]);
  });

  it("matches by place name as well as district", () => {
    const text = "Thunderstorms are expected over Selangor: Subang Jaya, Klang until 5:00 AM.";
    expect(matchMetWarnings(place({ district: undefined }), [warning(text)], NOW)).toHaveLength(1);
  });

  it("reads state aliases and strips district prefixes", () => {
    const text =
      "Heavy rain is expected over the states of Pulau Pinang (Timur Laut) • Kedah until 5:00 AM.";
    const georgeTown = place({
      name: "George Town",
      region: "Penang",
      district: "Daerah Timur Laut",
    });
    expect(
      matchMetWarnings(
        georgeTown,
        [warning(text, { warning_issue: { issued: "x", title_en: "Heavy Rain Warning" } })],
        NOW,
      ),
    ).toHaveLength(1);
    const seremban = place({ name: "Seremban", region: "Negeri Sembilan", district: "Seremban" });
    expect(
      matchMetWarnings(seremban, [warning("Thunderstorms over N. Sembilan until 5:00 AM.")], NOW),
    ).toHaveLength(1);
  });

  it("does not match a state name inside a longer word or another state", () => {
    expect(
      matchMetWarnings(
        DEFAULT_PLACE,
        [warning("Thunderstorms over the states of Pahang • Perak until 5 AM.")],
        NOW,
      ),
    ).toEqual([]);
  });

  it("only applies to Malaysian places", () => {
    const text = "Thunderstorms over Selangor until 5:00 AM.";
    expect(matchMetWarnings(place({ countryCode: "SG" }), [warning(text)], NOW)).toEqual([]);
    expect(matchMetWarnings(place({ region: undefined }), [warning(text)], NOW)).toEqual([]);
  });

  it("keeps only the latest of a repeated warning", () => {
    const text = "Thunderstorms over the state of Selangor until 5:00 AM.";
    const older = warning(text, { valid_to: "2026-10-27T03:00:00" });
    const newer = warning(text, { valid_to: "2026-10-27T06:00:00" });
    const result = matchMetWarnings(DEFAULT_PLACE, [older, newer], NOW);
    expect(result).toHaveLength(1);
    expect(result[0].ends).toBe("2026-10-27T06:00");
  });

  it("classifies titles", () => {
    const text = "Over the state of Selangor.";
    const titled = (title_en: string) =>
      matchMetWarnings(
        DEFAULT_PLACE,
        [warning(text, { warning_issue: { issued: "x", title_en } })],
        NOW,
      )[0];
    expect(titled("Continuous Rain Warning")).toMatchObject({ kind: "rain", severity: "warning" });
    expect(titled("Heat Wave Alert")).toMatchObject({ kind: "heat", severity: "advisory" });
    expect(titled("Strong Wind Warning")).toMatchObject({ kind: "wind" });
    expect(titled("Something Else")).toMatchObject({ kind: "other" });
  });
});
