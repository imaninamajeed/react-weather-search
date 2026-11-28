import { isFogCode, isSnowCode, isThunderstorm } from "./codes";
import type { CurrentConditions, DailyPoint } from "./types";

/**
 * The skies a hero or banner can be painted with. Each one is a block of tokens in globals.css
 * (`[data-sky="…"]`): the gradient, the glow, the clouds, and the ink that text on it uses.
 */
export const SKY_PALETTES = [
  "clear-day",
  "golden",
  "clear-night",
  "overcast-day",
  "overcast-night",
  "rain-day",
  "rain-night",
  "storm",
  "snow",
  "fog",
] as const;

export type SkyPalette = (typeof SKY_PALETTES)[number];

export type Precipitation = {
  kind: "drizzle" | "rain" | "snow" | "hail";
  /** 1 light, 2 moderate, 3 heavy. */
  intensity: 1 | 2 | 3;
};

/** What to draw: a palette, plus the layers that sit on it. */
export interface SkyScene {
  palette: SkyPalette;
  /** Where the light comes from, as a soft glow; the hero's own icon draws the sun or moon itself. */
  glow: "sun" | "low-sun" | "moon" | null;
  /** How many cloud layers drift across. */
  clouds: 0 | 1 | 2 | 3;
  precipitation: Precipitation | null;
  lightning: boolean;
  stars: boolean;
}

/** Sunrise and sunset light: this many minutes either side of either. */
const GOLDEN_MINUTES = 60;

/** Naive local ISO times ("2026-10-27T06:56") compared as if UTC: both sides share a timezone. */
function minutes(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(`${iso}Z`);
  return Number.isNaN(ms) ? null : ms / 60_000;
}

function isGoldenHour(time: string, today: Pick<DailyPoint, "sunrise" | "sunset"> | undefined) {
  const now = minutes(time);
  if (now === null || !today) return false;
  return [today.sunrise, today.sunset].some((edge) => {
    const at = minutes(edge);
    return at !== null && Math.abs(now - at) <= GOLDEN_MINUTES;
  });
}

const DRIZZLE: Record<number, 1 | 2 | 3> = { 51: 1, 56: 1, 53: 2, 55: 3, 57: 3 };
const RAIN: Record<number, 1 | 2 | 3> = { 61: 1, 66: 1, 80: 1, 63: 2, 81: 2, 65: 3, 67: 3, 82: 3 };
const SNOW: Record<number, 1 | 2 | 3> = { 71: 1, 77: 1, 85: 1, 73: 2, 75: 3, 86: 3 };

/** The falling layer for a WMO code, or null when nothing falls. */
export function precipitationFor(code: number): Precipitation | null {
  if (code === 96 || code === 99) return { kind: "hail", intensity: code === 99 ? 3 : 2 };
  if (code === 95) return { kind: "rain", intensity: 3 };
  if (code in DRIZZLE) return { kind: "drizzle", intensity: DRIZZLE[code] };
  if (code in RAIN) return { kind: "rain", intensity: RAIN[code] };
  if (code in SNOW) return { kind: "snow", intensity: SNOW[code] };
  return null;
}

function cloudLayers(cloudCover: number): 0 | 1 | 2 | 3 {
  if (cloudCover < 20) return 0;
  if (cloudCover < 50) return 1;
  if (cloudCover < 85) return 2;
  return 3;
}

const atLeast = (n: 0 | 1 | 2 | 3, min: 0 | 1 | 2 | 3) => Math.max(n, min) as 0 | 1 | 2 | 3;

/**
 * The sky over a place right now, from its forecast alone (never the viewer's clock), so the server
 * and the browser always draw the same one. Storms win over snow, snow over rain, rain over fog, fog
 * over cloud; a clear or partly cloudy sky within an hour of sunrise or sunset turns golden.
 */
export function skyScene(
  current: Pick<CurrentConditions, "time" | "isDay" | "weatherCode" | "cloudCover">,
  today: Pick<DailyPoint, "sunrise" | "sunset"> | undefined,
): SkyScene {
  const { weatherCode: code, isDay } = current;
  const clouds = cloudLayers(current.cloudCover);
  const base = { glow: null, precipitation: null, lightning: false, stars: false } as const;

  if (isThunderstorm(code)) {
    return {
      ...base,
      palette: "storm",
      clouds: 3,
      precipitation: precipitationFor(code),
      lightning: true,
    };
  }
  if (isSnowCode(code)) {
    return {
      ...base,
      palette: "snow",
      clouds: atLeast(clouds, 2),
      precipitation: precipitationFor(code),
    };
  }
  const falling = precipitationFor(code);
  if (falling) {
    return {
      ...base,
      palette: isDay ? "rain-day" : "rain-night",
      clouds: atLeast(clouds, 2),
      precipitation: falling,
    };
  }
  if (isFogCode(code)) return { ...base, palette: "fog", clouds: 0 };
  // Overcast, and any code we don't know (its icon is a plain cloud, so the sky matches).
  if (code > 2) {
    return { ...base, palette: isDay ? "overcast-day" : "overcast-night", clouds: 3 };
  }

  // Clear, mainly clear or partly cloudy.
  const layers = code === 2 ? atLeast(clouds, 1) : clouds === 3 ? 2 : clouds;
  if (!isDay) return { ...base, palette: "clear-night", clouds: layers, glow: "moon", stars: true };
  if (isGoldenHour(current.time, today)) {
    return { ...base, palette: "golden", clouds: layers, glow: "low-sun" };
  }
  return { ...base, palette: "clear-day", clouds: layers, glow: "sun" };
}

/** A typical scene for each palette, for banners that set a mood rather than report a place. */
export function skyPreset(palette: SkyPalette): SkyScene {
  const base = {
    palette,
    glow: null,
    clouds: 0,
    precipitation: null,
    lightning: false,
    stars: false,
  } satisfies SkyScene;
  switch (palette) {
    case "clear-day":
      return { ...base, glow: "sun", clouds: 1 };
    case "golden":
      return { ...base, glow: "low-sun", clouds: 1 };
    case "clear-night":
      return { ...base, glow: "moon", stars: true };
    case "overcast-day":
    case "overcast-night":
      return { ...base, clouds: 3 };
    case "rain-day":
    case "rain-night":
      return { ...base, clouds: 2, precipitation: { kind: "rain", intensity: 2 } };
    case "storm":
      return {
        ...base,
        clouds: 3,
        precipitation: { kind: "rain", intensity: 3 },
        lightning: true,
      };
    case "snow":
      return { ...base, clouds: 2, precipitation: { kind: "snow", intensity: 2 } };
    case "fog":
      return base;
  }
}
