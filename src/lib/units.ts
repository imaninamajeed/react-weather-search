import type { Units } from "@/lib/weather/types";

export const DEFAULT_UNITS: Units = "metric";

export function isUnits(value: unknown): value is Units {
  return value === "metric" || value === "imperial";
}

export const convertTemperature = (celsius: number, units: Units) =>
  units === "imperial" ? (celsius * 9) / 5 + 32 : celsius;

export const convertSpeed = (kmh: number, units: Units) =>
  units === "imperial" ? kmh * 0.621371 : kmh;

export const convertPrecipitation = (mm: number, units: Units) =>
  units === "imperial" ? mm / 25.4 : mm;

export const convertPressure = (hpa: number, units: Units) =>
  units === "imperial" ? hpa * 0.02953 : hpa;

/** Centimetres in, centimetres or inches out. */
export const convertSnowfall = (cm: number, units: Units) =>
  units === "imperial" ? cm / 2.54 : cm;

/** Metres in, kilometres or miles out. */
export const convertDistance = (metres: number, units: Units) =>
  units === "imperial" ? metres / 1609.344 : metres / 1000;

export function unitLabels(units: Units) {
  return units === "imperial"
    ? { temperature: "°F", speed: "mph", precipitation: "in", pressure: "inHg", distance: "mi" }
    : { temperature: "°C", speed: "km/h", precipitation: "mm", pressure: "hPa", distance: "km" };
}

/** "29°" – the degree sign only, because the unit is shown once nearby. */
export function formatTemperature(celsius: number, units: Units): string {
  return `${Math.round(convertTemperature(celsius, units))}°`;
}

export function formatSpeed(kmh: number, units: Units): string {
  return `${Math.round(convertSpeed(kmh, units))} ${unitLabels(units).speed}`;
}

export function formatPrecipitation(mm: number, units: Units): string {
  const value = convertPrecipitation(mm, units);
  const digits = units === "imperial" ? 2 : value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${unitLabels(units).precipitation}`;
}

export function formatSnowfall(cm: number, units: Units): string {
  const value = convertSnowfall(cm, units);
  return `${units === "imperial" ? value.toFixed(1) : Math.round(value)} ${units === "imperial" ? "in" : "cm"}`;
}

export function formatPressure(hpa: number, units: Units): string {
  const value = convertPressure(hpa, units);
  return `${units === "imperial" ? value.toFixed(2) : Math.round(value)} ${unitLabels(units).pressure}`;
}

export function formatDistance(metres: number, units: Units): string {
  const value = convertDistance(metres, units);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${unitLabels(units).distance}`;
}

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

/** Direction the wind is blowing *from*, as a 16-point compass label. */
export function compassPoint(degrees: number): string {
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS[index];
}
