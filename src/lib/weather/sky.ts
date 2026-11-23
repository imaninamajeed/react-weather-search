import { isPrecipitation, isThunderstorm } from "./codes";

/**
 * A single tint for the hero panel, picked from time of day and conditions. It is mixed into
 * the card colour at low strength, so it works in both themes.
 */
export function skyTint(weatherCode: number, isDay: boolean): string {
  if (isThunderstorm(weatherCode)) return "oklch(0.5 0.16 295)";
  if (!isDay) return "oklch(0.45 0.12 270)";
  if (isPrecipitation(weatherCode)) return "oklch(0.62 0.06 245)";
  if (weatherCode >= 2) return "oklch(0.7 0.03 240)";
  return "oklch(0.8 0.12 200)";
}
