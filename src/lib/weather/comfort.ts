/**
 * Plain-language readings for two numbers most people can't interpret on their own.
 *
 * Dew point is the best single measure of how humid the air feels (relative humidity alone is not:
 * 90 % at 5 °C feels dry, 60 % at 30 °C feels muggy). The bands are the ones forecasters commonly
 * quote for comfort.
 */
export type ComfortLevel = "dry" | "comfortable" | "sticky" | "muggy" | "oppressive";

/** `dewPoint` in °C. */
export function dewPointComfort(dewPoint: number): ComfortLevel {
  if (dewPoint < 10) return "dry";
  if (dewPoint < 16) return "comfortable";
  if (dewPoint < 20) return "sticky";
  if (dewPoint < 24) return "muggy";
  return "oppressive";
}

export type PressureLevel = "low" | "normal" | "high";

/**
 * Sea-level pressure in hPa against the 1013 hPa average. A single reading is only a loose guide
 * (the trend matters more, and the tropics vary little), so the bands are wide and the wording
 * that goes with them says "often", never "will".
 */
export function pressureLevel(pressure: number): PressureLevel {
  if (pressure < 1000) return "low";
  if (pressure > 1022) return "high";
  return "normal";
}
