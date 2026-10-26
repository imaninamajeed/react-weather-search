import { isThunderstorm } from "@/lib/weather/codes";
import type { AirQuality, Forecast } from "@/lib/weather/types";
import type { AlertSeverity, ForecastHazard, HazardKind } from "./types";

/**
 * Thresholds for forecast-derived hazards. These are our own conservative defaults, informed by
 * national warning criteria but not copied from any one service, which is why these alerts are
 * always labelled "forecast signal" and shown below official warnings.
 *
 *   thunderstorm  WMO 95 with ≥ 40 % precipitation chance → advisory; 96/99 (hail) → warning
 *   intense rain  ≥ 10 mm/h → advisory; ≥ 30 mm/h → warning               (hourly, 72 h)
 *   heavy rain    ≥ 30 mm/day → advisory; ≥ 60 mm/day → warning           (daily, 7 days)
 *   gusts         ≥ 60 km/h → advisory; ≥ 90 km/h → warning                (hourly, 72 h)
 *   heat          highs ≥ 35 °C on 3+ days → advisory; ≥ 37 °C on 3+ → warning (MET Malaysia heat-wave tiers)
 *   frost         lows ≤ 0 °C → advisory; ≤ −10 °C → warning
 *   snow          ≥ 5 cm/day → advisory; ≥ 20 cm/day → warning
 *   air quality   US AQI ≥ 151 → advisory; ≥ 201 → warning (EPA "Unhealthy" / "Very unhealthy")
 *
 * UV is deliberately not an alert: in the tropics it is "very high" every day, so it would fire
 * constantly and teach people to ignore alerts. It lives in the conditions grid instead.
 */
export const THRESHOLDS = {
  thunderstormProbability: 40,
  rainRate: { advisory: 10, warning: 30 },
  rainTotal: { advisory: 30, warning: 60 },
  gusts: { advisory: 60, warning: 90 },
  heat: { advisory: 35, warning: 37, minDays: 3 },
  frost: { advisory: 0, warning: -10 },
  snow: { advisory: 5, warning: 20 },
  aqi: { advisory: 151, warning: 201 },
} as const;

const DAILY_HORIZON = 7;
/** Hours that qualify within this many hours of each other count as one event. */
const HOURLY_MAX_GAP = 1;

type Level = 0 | 1 | 2;

const severityOf = (level: Level): AlertSeverity => (level === 2 ? "warning" : "advisory");

function levelFor(value: number, advisory: number, warning: number): Level {
  return value >= warning ? 2 : value >= advisory ? 1 : 0;
}

/** Index ranges of consecutive truthy entries, bridging gaps of up to `maxGap` falsy entries. */
export function runs(flags: boolean[], maxGap = 0): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  let start = -1;
  let last = -1;
  flags.forEach((on, index) => {
    if (!on) return;
    if (start !== -1 && index - last - 1 <= maxGap) {
      last = index;
      return;
    }
    if (start !== -1) result.push([start, last]);
    start = index;
    last = index;
  });
  if (start !== -1) result.push([start, last]);
  return result;
}

function windows<T extends { time: string } | { date: string }>(
  items: T[],
  config: {
    kind: HazardKind;
    metric: ForecastHazard["metric"];
    granularity: ForecastHazard["granularity"];
    level: (item: T) => Level;
    value: (item: T) => number;
    maxGap?: number;
    /** Combine with other aggregate: the highest or (for cold) the lowest value is the peak. */
    pick?: "max" | "min";
  },
): ForecastHazard[] {
  const stamp = (item: T) => ("time" in item ? item.time : item.date);
  const levels = items.map(config.level);
  return runs(
    levels.map((level) => level > 0),
    config.maxGap,
  ).map(([from, to]) => {
    const values = items.slice(from, to + 1).map(config.value);
    return {
      source: "forecast",
      id: `${config.kind}-${config.metric}-${stamp(items[from])}`,
      kind: config.kind,
      severity: severityOf(Math.max(...levels.slice(from, to + 1)) as Level),
      granularity: config.granularity,
      start: stamp(items[from]),
      end: stamp(items[to]),
      peak: config.pick === "min" ? Math.min(...values) : Math.max(...values),
      metric: config.metric,
    };
  });
}

/**
 * Finds hazards in a forecast: storms, intense rain and gusts from the next 72 hourly values;
 * heavy rain, heat, frost and snow from the next 7 daily values; air quality from its reading.
 * Pure and deterministic, so every threshold is unit-tested.
 */
export function detectHazards(
  forecast: Forecast,
  airQuality?: AirQuality | null,
): ForecastHazard[] {
  const { hourly } = forecast;
  const daily = forecast.daily.slice(0, DAILY_HORIZON);
  const hazards: ForecastHazard[] = [];

  hazards.push(
    ...windows(hourly, {
      kind: "thunderstorm",
      metric: "probability",
      granularity: "hour",
      maxGap: HOURLY_MAX_GAP,
      level: (h) =>
        isThunderstorm(h.weatherCode) &&
        h.precipitationProbability >= THRESHOLDS.thunderstormProbability
          ? h.weatherCode === 95
            ? 1
            : 2
          : 0,
      value: (h) => h.precipitationProbability,
    }),
  );

  const heavyRainDays = windows(daily, {
    kind: "rain",
    metric: "total",
    granularity: "day",
    level: (d) =>
      levelFor(d.precipitationSum, THRESHOLDS.rainTotal.advisory, THRESHOLDS.rainTotal.warning),
    value: (d) => d.precipitationSum,
  });
  hazards.push(...heavyRainDays);

  // A downpour inside a day that already has a heavy-rain alert of equal or higher severity adds no information.
  const covered = (hazard: ForecastHazard) =>
    heavyRainDays.some(
      (day) =>
        day.start <= hazard.start.slice(0, 10) &&
        hazard.start.slice(0, 10) <= day.end &&
        (day.severity === "warning" || hazard.severity === "advisory"),
    );
  hazards.push(
    ...windows(hourly, {
      kind: "rain",
      metric: "rate",
      granularity: "hour",
      maxGap: HOURLY_MAX_GAP,
      level: (h) =>
        levelFor(h.precipitation, THRESHOLDS.rainRate.advisory, THRESHOLDS.rainRate.warning),
      value: (h) => h.precipitation,
    }).filter((hazard) => !covered(hazard)),
  );

  hazards.push(
    ...windows(hourly, {
      kind: "wind",
      metric: "gust",
      granularity: "hour",
      maxGap: HOURLY_MAX_GAP,
      level: (h) => levelFor(h.windGusts, THRESHOLDS.gusts.advisory, THRESHOLDS.gusts.warning),
      value: (h) => h.windGusts,
    }),
  );

  // Heat only counts once it persists: a single hot day is weather, a hot spell is a hazard.
  const hot = daily.map((d) => d.temperatureMax >= THRESHOLDS.heat.advisory);
  for (const [from, to] of runs(hot)) {
    if (to - from + 1 < THRESHOLDS.heat.minDays) continue;
    const spell = daily.slice(from, to + 1);
    const extreme = runs(spell.map((d) => d.temperatureMax >= THRESHOLDS.heat.warning)).some(
      ([a, b]) => b - a + 1 >= THRESHOLDS.heat.minDays,
    );
    hazards.push({
      source: "forecast",
      id: `heat-max-temp-${spell[0].date}`,
      kind: "heat",
      severity: extreme ? "warning" : "advisory",
      granularity: "day",
      start: spell[0].date,
      end: spell[spell.length - 1].date,
      peak: Math.max(...spell.map((d) => d.temperatureMax)),
      metric: "max-temp",
    });
  }

  hazards.push(
    ...windows(daily, {
      kind: "frost",
      metric: "min-temp",
      granularity: "day",
      pick: "min",
      level: (d) =>
        d.temperatureMin <= THRESHOLDS.frost.warning
          ? 2
          : d.temperatureMin <= THRESHOLDS.frost.advisory
            ? 1
            : 0,
      value: (d) => d.temperatureMin,
    }),
    ...windows(daily, {
      kind: "snow",
      metric: "snowfall",
      granularity: "day",
      level: (d) => levelFor(d.snowfallSum, THRESHOLDS.snow.advisory, THRESHOLDS.snow.warning),
      value: (d) => d.snowfallSum,
    }),
  );

  if (airQuality) {
    const level = levelFor(airQuality.usAqi, THRESHOLDS.aqi.advisory, THRESHOLDS.aqi.warning);
    if (level > 0) {
      const hour = `${airQuality.time.slice(0, 13)}:00`;
      hazards.push({
        source: "forecast",
        id: `air-quality-aqi-${hour}`,
        kind: "air-quality",
        severity: severityOf(level),
        granularity: "hour",
        start: hour,
        end: hour,
        peak: airQuality.usAqi,
        metric: "aqi",
      });
    }
  }

  return hazards;
}
