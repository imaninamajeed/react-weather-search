import { formatHourRange } from "@/lib/format";
import { formatSpeed } from "@/lib/units";
import { isThunderstorm } from "./codes";
import type { Forecast, HourlyPoint, Units } from "./types";

const HORIZON_HOURS = 24;
const GUST_NOTICE_KMH = 50;

/** Describes how it feels using apparent temperature, which already accounts for humidity and wind. */
export function describeFeel(apparentTemperature: number, dewPoint: number): string {
  const base =
    apparentTemperature < 5
      ? "Cold"
      : apparentTemperature < 12
        ? "Chilly"
        : apparentTemperature < 20
          ? "Cool"
          : apparentTemperature < 26
            ? "Mild"
            : apparentTemperature < 32
              ? "Warm"
              : apparentTemperature < 38
                ? "Hot"
                : "Very hot";
  // Dew points above ~20 °C feel muggy to most people.
  return dewPoint >= 20 && apparentTemperature >= 24 ? `${base} and humid` : base;
}

const isWet = (hour: HourlyPoint) =>
  hour.precipitationProbability >= 50 ||
  hour.precipitation >= 0.5 ||
  isThunderstorm(hour.weatherCode);

const isSnowCode = (code: number) => (code >= 71 && code <= 77) || code === 85 || code === 86;

function precipitationKind(run: HourlyPoint[]): string {
  if (run.some((hour) => isThunderstorm(hour.weatherCode))) return "Thunderstorms";
  if (run.some((hour) => isSnowCode(hour.weatherCode))) return "Snow";
  if (run.some((hour) => hour.precipitation >= 4)) return "Heavy rain";
  return "Rain";
}

/** The first run of consecutive wet hours within the horizon, with its position. */
function firstWetRun(hours: HourlyPoint[]) {
  const start = hours.findIndex(isWet);
  if (start === -1) return null;
  let end = start;
  while (end + 1 < hours.length && isWet(hours[end + 1])) end++;
  return { start, end, hours: hours.slice(start, end + 1) };
}

/**
 * A deterministic, one-or-two-sentence read of the next 24 hours, e.g.
 * "Warm and humid. Thunderstorms likely 3–6 PM today."
 * Rule-based on purpose: it is testable, instant and never wrong in a creative way.
 */
export function summarizeToday(forecast: Forecast, units: Units): string {
  const { current, hourly } = forecast;
  const horizon = hourly.slice(0, HORIZON_HOURS);
  const sentences = [`${describeFeel(current.apparentTemperature, current.dewPoint)}.`];

  const run = firstWetRun(horizon);
  if (!run) {
    sentences.push("Staying dry for the next 24 hours.");
  } else {
    const kind = precipitationKind(run.hours);
    const first = run.hours[0].time;
    const last = run.hours[run.hours.length - 1].time;
    const range = formatHourRange(first, last);
    if (run.start === 0 && run.end === horizon.length - 1) {
      sentences.push(`${kind} continuing through the next 24 hours.`);
    } else if (run.start === 0) {
      sentences.push(`${kind} now, easing around ${range.split("–").pop()}.`);
    } else {
      const day = first.slice(0, 10) === current.time.slice(0, 10) ? "today" : "tomorrow";
      sentences.push(`${kind} likely ${range} ${day}.`);
    }
  }

  const peakGust = Math.max(...horizon.map((hour) => hour.windGusts), current.windGusts);
  if (peakGust >= GUST_NOTICE_KMH) sentences.push(`Gusts up to ${formatSpeed(peakGust, units)}.`);

  return sentences.join(" ");
}
