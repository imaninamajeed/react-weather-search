import { formatHour, formatHourRange } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";
import { formatSpeed } from "@/lib/units";
import { isThunderstorm } from "./codes";
import type { Forecast, HourlyPoint, Units } from "./types";

const HORIZON_HOURS = 24;
const GUST_NOTICE_KMH = 50;

/** Describes how it feels using apparent temperature, which already accounts for humidity and wind. */
export function describeFeel(
  apparentTemperature: number,
  dewPoint: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const { feel } = getMessages(locale).weather;
  const base =
    apparentTemperature < 5
      ? feel.cold
      : apparentTemperature < 12
        ? feel.chilly
        : apparentTemperature < 20
          ? feel.cool
          : apparentTemperature < 26
            ? feel.mild
            : apparentTemperature < 32
              ? feel.warm
              : apparentTemperature < 38
                ? feel.hot
                : feel.veryHot;
  // Dew points above ~20 °C feel muggy to most people.
  return dewPoint >= 20 && apparentTemperature >= 24 ? feel.andHumid(base) : base;
}

const isWet = (hour: HourlyPoint) =>
  hour.precipitationProbability >= 50 ||
  hour.precipitation >= 0.5 ||
  isThunderstorm(hour.weatherCode);

const isSnowCode = (code: number) => (code >= 71 && code <= 77) || code === 85 || code === 86;

function precipitationKind(run: HourlyPoint[], locale: Locale): string {
  const { kind } = getMessages(locale).weather;
  if (run.some((hour) => isThunderstorm(hour.weatherCode))) return kind.thunderstorms;
  if (run.some((hour) => isSnowCode(hour.weatherCode))) return kind.snow;
  if (run.some((hour) => hour.precipitation >= 4)) return kind.heavyRain;
  return kind.rain;
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
export function summarizeToday(
  forecast: Forecast,
  units: Units,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const { summary, day: dayNames } = getMessages(locale).weather;
  const { current, hourly } = forecast;
  const horizon = hourly.slice(0, HORIZON_HOURS);
  const sentences = [
    summary.sentence(describeFeel(current.apparentTemperature, current.dewPoint, locale)),
  ];

  const run = firstWetRun(horizon);
  if (!run) {
    sentences.push(summary.dry);
  } else {
    const kind = precipitationKind(run.hours, locale);
    const first = run.hours[0].time;
    const last = run.hours[run.hours.length - 1].time;
    const range = formatHourRange(first, last, locale);
    if (run.start === 0 && run.end === horizon.length - 1) {
      sentences.push(summary.continuing(kind));
    } else if (run.start === 0) {
      sentences.push(summary.easing(kind, range.split("–").pop() ?? range));
    } else {
      const day =
        first.slice(0, 10) === current.time.slice(0, 10) ? dayNames.today : dayNames.tomorrow;
      sentences.push(summary.likely(kind, range, day));
    }
  }

  const peakGust = Math.max(...horizon.map((hour) => hour.windGusts), current.windGusts);
  if (peakGust >= GUST_NOTICE_KMH) sentences.push(summary.gusts(formatSpeed(peakGust, units)));

  return sentences.join(" ");
}

/**
 * Rain as something to act on, for a place's tile: "Rain from 3 PM", "Rain until 11 AM",
 * "Thunderstorms from 4 AM tomorrow", or "Dry for the next 24 h". It uses the same notion of a wet hour
 * (and the same kind of weather) as summarizeToday, so a tile and the hero never disagree.
 */
export function describeRainOutlook(
  hourly: HourlyPoint[],
  locale: Locale = DEFAULT_LOCALE,
): string {
  const { rainOutlook } = getMessages(locale).weather;
  const horizon = hourly.slice(0, HORIZON_HOURS);
  const run = firstWetRun(horizon);
  if (!run) return rainOutlook.dry;

  const kind = precipitationKind(run.hours, locale);
  const first = run.hours[0].time;
  const last = run.hours[run.hours.length - 1].time;
  if (run.start === 0 && run.end === horizon.length - 1) return rainOutlook.throughout(kind);
  if (run.start === 0) {
    const range = formatHourRange(first, last, locale);
    return rainOutlook.until(kind, range.split("–").pop() ?? range);
  }
  const tomorrow = first.slice(0, 10) !== horizon[0].time.slice(0, 10);
  return rainOutlook.from(kind, formatHour(first, locale), tomorrow);
}
