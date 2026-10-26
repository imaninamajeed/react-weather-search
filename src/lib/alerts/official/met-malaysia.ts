import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { fetchJson } from "@/lib/open-meteo/client";
import type { Place } from "@/lib/places";
import type { HazardKind, OfficialAlert } from "../types";

const SOURCE = "met-malaysia";
const ENDPOINT = "https://api.data.gov.my/weather/warning?limit=50";
const ISSUER = "MET Malaysia";
const URL = "https://www.met.gov.my/";

const warningSchema = z.object({
  warning_issue: z.object({ issued: z.string(), title_en: z.string() }),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  heading_en: z.string().nullable(),
  text_en: z.string().nullable(),
  instruction_en: z.string().nullable(),
});

export type MetWarning = z.infer<typeof warningSchema>;

export async function getMetMalaysiaWarnings(): Promise<MetWarning[]> {
  "use cache";
  cacheLife("alerts");
  return fetchJson(ENDPOINT, z.array(warningSchema), { source: "data.gov.my/weather-warning" });
}

const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wholeWord = (needle: string) =>
  new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?![a-z0-9])`);

// MET writes some states differently from the geocoder ("N. Sembilan", "Pulau Pinang").
const STATE_ALIASES: Record<string, string[]> = {
  penang: ["penang", "pulau pinang"],
  "negeri sembilan": ["negeri sembilan", "n sembilan"],
  melaka: ["melaka", "malacca"],
};

/** "Daerah Kinta", "Bahagian Kuching", "WP. Kuala Lumpur" → the bare district name. */
const bareDistrict = (district: string) =>
  normalize(district).replace(/^(daerah|bahagian|wp|wilayah persekutuan)\s+/, "");

/** Marine bulletins ("…waters of Selangor") describe the sea, not the land. */
const isMarine = (title: string) => /\b(seas?|waters|marine|laut)\b/i.test(title);

function classify(title: string): Pick<OfficialAlert, "kind" | "severity"> {
  const kind: HazardKind | "other" = /thunder|ribut petir/i.test(title)
    ? "thunderstorm"
    : /rain|hujan/i.test(title)
      ? "rain"
      : /wind|angin/i.test(title)
        ? "wind"
        : /heat|hot|panas/i.test(title)
          ? "heat"
          : "other";
  // MET names its levels in the title; anything titled "Warning" (or unlabelled) is shown as one.
  const severity =
    /\b(alert|advisory|waspada)\b/i.test(title) && !/warning/i.test(title) ? "advisory" : "warning";
  return { kind, severity };
}

/**
 * Whether a warning's area text covers this place. The text lists states, sometimes with
 * districts ("Pahang (Kuantan, Temerloh) • Sarawak: Mukah, Sibu"). A bare state means the whole
 * state; a state followed by a list only covers the places named in it. Matching is by name, so
 * it errs toward missing a district-level warning rather than raising a false one.
 */
function covers(place: Place, text: string): boolean {
  const state = normalize(place.region ?? "");
  if (!state) return false;
  const body = normalize(text);

  for (const alias of STATE_ALIASES[state] ?? [state]) {
    const match = wholeWord(alias).exec(body);
    if (!match) continue;
    const after = body.slice(match.index + match[0].length);
    const end = [after.indexOf("•"), after.indexOf(" until ")].filter((i) => i >= 0);
    const segment = after.slice(0, end.length ? Math.min(...end) : undefined);
    if (!/^\s*[:(]/.test(after)) return true; // state-wide
    const names = [normalize(place.name), place.district ? bareDistrict(place.district) : ""];
    return names.some((name) => name && wholeWord(name).test(` ${segment} `));
  }
  return false;
}

/** The active or upcoming MET Malaysia land warnings that cover `place`. `now` is MYT wall-clock time. */
export function matchMetWarnings(
  place: Place,
  warnings: MetWarning[],
  now: string,
): OfficialAlert[] {
  if (place.countryCode !== "MY") return [];

  const latest = new Map<string, MetWarning>();
  for (const warning of warnings) {
    const { valid_from: from, valid_to: to, text_en: text } = warning;
    const title = warning.warning_issue.title_en;
    if (!from || !to || !text || isMarine(title)) continue; // "No Advisory" entries have no validity
    if (to.slice(0, 16) <= now || !covers(place, text)) continue;
    // The feed repeats a warning with successive validity windows; keep the latest.
    const key = `${title}|${text}`;
    const existing = latest.get(key);
    if (!existing || (existing.valid_to ?? "") < to) latest.set(key, warning);
  }

  return [...latest.values()].map((warning) => {
    const title = warning.warning_issue.title_en;
    return {
      source: SOURCE,
      id: `${SOURCE}:${warning.warning_issue.issued}:${title}:${warning.valid_from}`,
      ...classify(title),
      title,
      summary:
        warning.heading_en && warning.heading_en.toLowerCase() !== title.toLowerCase()
          ? warning.heading_en
          : undefined,
      text: warning.text_en ?? "",
      instruction: warning.instruction_en ?? undefined,
      starts: warning.valid_from?.slice(0, 16) ?? null,
      ends: warning.valid_to?.slice(0, 16) ?? null,
      issuer: ISSUER,
      url: URL,
    } satisfies OfficialAlert;
  });
}
