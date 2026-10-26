import { addDays, formatDayMonth, formatWeekday } from "@/lib/format";
import { formatPrecipitation } from "@/lib/units";
import type { Units } from "./types";

export const MODELS = [
  { id: "ecmwf_ifs025", label: "ECMWF" },
  { id: "gfs_seamless", label: "GFS" },
  { id: "icon_seamless", label: "ICON" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
export const MODEL_LABELS = Object.fromEntries(MODELS.map((m) => [m.id, m.label])) as Record<
  ModelId,
  string
>;

/** A model with no data for a day is simply absent. */
export type ModelValues = Partial<Record<ModelId, number>>;

export interface ModelDay {
  date: string;
  /** Daily high, °C, per model. */
  temperatureMax: ModelValues;
  /** Daily rainfall total, mm, per model. */
  precipitation: ModelValues;
}

export type ConfidenceLevel = "high" | "medium" | "low";
const LEVELS: ConfidenceLevel[] = ["high", "medium", "low"];

/**
 * How far apart the models' daily highs may be (°C) before confidence drops a step. Rain can
 * lower it one further step: the models disagreeing on wet vs dry, or on the amount by a wide margin.
 */
export const CONFIDENCE_THRESHOLDS = {
  highMaxSpread: 2,
  mediumMaxSpread: 3.5,
  /** "Dry" is under this many mm, "wet" at least `wet`. */
  dry: 0.5,
  wet: 2,
  /** Amounts differ widely at this many mm, or half of the wettest model, whichever is larger. */
  amountGap: 10,
  /** Heavy rain worth calling out by name when one model expects this much. */
  heavyRain: 30,
} as const;

export interface DayConfidence extends ModelDay {
  /** null when fewer than two models have data. */
  level: ConfidenceLevel | null;
  temperatureRange: [number, number] | null;
  rainRange: [number, number] | null;
  rainSplit: boolean;
  rainAmountSplit: boolean;
}

const range = (values: number[]): [number, number] | null =>
  values.length ? [Math.min(...values), Math.max(...values)] : null;

export function assessDay(day: ModelDay): DayConfidence {
  const temperatures = Object.values(day.temperatureMax);
  const rain = Object.values(day.precipitation);
  const temperatureRange = range(temperatures);
  const rainRange = range(rain);

  const [rainLow, rainHigh] = rainRange ?? [0, 0];
  const t = CONFIDENCE_THRESHOLDS;
  const rainSplit = rain.length >= 2 && rainLow < t.dry && rainHigh >= t.wet;
  const rainAmountSplit =
    rain.length >= 2 && rainHigh - rainLow >= Math.max(t.amountGap, rainHigh / 2);

  let level: ConfidenceLevel | null = null;
  if (temperatureRange && temperatures.length >= 2) {
    const spread = temperatureRange[1] - temperatureRange[0];
    const step = spread <= t.highMaxSpread ? 0 : spread <= t.mediumMaxSpread ? 1 : 2;
    level = LEVELS[Math.min(2, step + (rainSplit || rainAmountSplit ? 1 : 0))];
  }

  return { ...day, level, temperatureRange, rainRange, rainSplit, rainAmountSplit };
}

export const assessConfidence = (days: ModelDay[]): DayConfidence[] => days.map(assessDay);

const dayName = (date: string, today: string) =>
  date === today
    ? "today"
    : date === addDays(today, 1)
      ? "tomorrow"
      : `${formatWeekday(date)} ${formatDayMonth(date)}`;

/**
 * Plain-language read of how far to trust the week, e.g.
 * "The models agree closely through Thu Oct 29, then start to diverge."
 */
export function summarizeConfidence(days: DayConfidence[], units: Units, today: string): string {
  if (days.every((day) => day.level === null)) {
    return "There isn't enough model data to compare forecasts for this location.";
  }

  const sentences: string[] = [];
  const firstUncertain = days.findIndex((day) => day.level !== "high");
  if (firstUncertain === -1) {
    sentences.push("The models agree closely all week.");
  } else if (firstUncertain === 0) {
    sentences.push(
      days[0].level === "low"
        ? "The models disagree noticeably even about today, so treat the details as uncertain."
        : "The models are only loosely aligned, even for today.",
    );
  } else {
    sentences.push(
      `The models agree closely through ${dayName(days[firstUncertain - 1].date, today)}, then start to diverge.`,
    );
  }

  // The most striking disagreement over heavy rain: one model far wetter than the rest.
  const outlier = days
    .filter(
      (day) =>
        day.rainAmountSplit && day.rainRange && day.rainRange[1] >= CONFIDENCE_THRESHOLDS.heavyRain,
    )
    .sort((a, b) => b.rainRange![1] - b.rainRange![0] - (a.rainRange![1] - a.rainRange![0]))[0];
  if (outlier) {
    const entries = Object.entries(outlier.precipitation) as Array<[ModelId, number]>;
    const [wettest, amount] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    const others = entries.filter(([id]) => id !== wettest).map(([, value]) => value);
    sentences.push(
      `${MODEL_LABELS[wettest]} expects ${formatPrecipitation(amount, units)} of rain ${dayName(outlier.date, today)}, far more than the other models (${formatPrecipitation(Math.min(...others), units)} to ${formatPrecipitation(Math.max(...others), units)}).`,
    );
  }

  return sentences.join(" ");
}
