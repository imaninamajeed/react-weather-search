import { formatDayMonth, formatWeekday } from "@/lib/format";
import { getModelDays } from "@/lib/open-meteo/models";
import {
  CONFIDENCE_THRESHOLDS,
  MODELS,
  assessConfidence,
  summarizeConfidence,
} from "@/lib/weather/confidence";
import { convertPrecipitation, convertTemperature, unitLabels } from "@/lib/units";
import type { Units } from "@/lib/weather/types";
import { CONFIDENCE_LABEL } from "./confidence-dots";
import { ConfidenceChart } from "./confidence-chart";

/**
 * Compares three independent weather models (ECMWF, GFS, ICON). Where they agree, the forecast
 * is solid; where they spread apart, the real answer is uncertain. This is the honest answer to
 * "can I trust day 5?".
 */
export async function ConfidencePanel({
  latitude,
  longitude,
  units,
  today,
}: {
  latitude: number;
  longitude: number;
  units: Units;
  today: string;
}) {
  const days = assessConfidence(await getModelDays(latitude, longitude));
  const labels = unitLabels(units);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-lg text-balance">{summarizeConfidence(days, units, today)}</p>

      <ConfidenceChart days={days} units={units} />

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium select-none">
          View as table
        </summary>
        <div
          className="relative overflow-x-auto border-t border-border"
          tabIndex={0}
          role="region"
          aria-label="Model comparison table"
        >
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">Daily high and rainfall by model</caption>
            <thead>
              <tr className="label-caps text-left">
                <th scope="col" className="px-4 py-2 font-medium">
                  Day
                </th>
                {MODELS.map((m) => (
                  <th key={m.id} scope="col" className="px-2 py-2 text-right font-medium">
                    {m.label} high ({labels.temperature})
                  </th>
                ))}
                {MODELS.map((m) => (
                  <th key={m.id} scope="col" className="px-2 py-2 text-right font-medium">
                    {m.label} rain ({labels.precipitation})
                  </th>
                ))}
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {days.map((day) => (
                <tr key={day.date} className="border-t border-border/60">
                  <th scope="row" className="px-4 py-1.5 text-left font-normal">
                    {formatWeekday(day.date)} {formatDayMonth(day.date)}
                  </th>
                  {MODELS.map((m) => (
                    <td key={m.id} className="px-2 py-1.5 text-right">
                      {day.temperatureMax[m.id] === undefined
                        ? "—"
                        : Math.round(convertTemperature(day.temperatureMax[m.id]!, units))}
                    </td>
                  ))}
                  {MODELS.map((m) => (
                    <td key={m.id} className="px-2 py-1.5 text-right">
                      {day.precipitation[m.id] === undefined
                        ? "—"
                        : convertPrecipitation(day.precipitation[m.id]!, units).toFixed(1)}
                    </td>
                  ))}
                  <td className="px-4 py-1.5 text-right">
                    {day.level ? CONFIDENCE_LABEL[day.level] : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground select-none">
          How is this calculated?
        </summary>
        <p className="mt-2 max-w-prose">
          Each day compares the high temperature predicted by ECMWF, GFS and ICON. If they are
          within {CONFIDENCE_THRESHOLDS.highMaxSpread}°C of each other, confidence is high; within{" "}
          {CONFIDENCE_THRESHOLDS.mediumMaxSpread}°C, medium; wider, low. It drops one more step when
          the models split on whether it will rain at all, or when their rainfall totals differ
          widely. The shaded band on the chart is the range between the lowest and highest model.
        </p>
      </details>
    </div>
  );
}
