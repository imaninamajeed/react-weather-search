import Link from "next/link";
import { formatDayMonth, formatWeekday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { getModelDays } from "@/lib/open-meteo/models";
import {
  CONFIDENCE_THRESHOLDS,
  MODELS,
  assessConfidence,
  summarizeConfidence,
} from "@/lib/weather/confidence";
import { convertPrecipitation, convertTemperature, unitLabels } from "@/lib/units";
import type { Units } from "@/lib/weather/types";
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
  const [modelDays, { locale, t }] = await Promise.all([
    getModelDays(latitude, longitude),
    getI18n(),
  ]);
  const days = assessConfidence(modelDays);
  const text = t.place.confidence;
  const labels = unitLabels(units);

  return (
    <div className="space-y-6 fit:flex fit:flex-col fit:gap-3 fit:space-y-0">
      <p className="max-w-prose text-lg text-balance fit:text-base">
        {summarizeConfidence(days, units, today, locale)}
      </p>

      <ConfidenceChart days={days} units={units} />

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium select-none">
          {text.viewAsTable}
        </summary>
        <div
          className="relative overflow-x-auto border-t border-border"
          tabIndex={0}
          role="region"
          aria-label={text.tableLabel}
        >
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">{text.caption}</caption>
            <thead>
              <tr className="label-caps text-left">
                <th scope="col" className="px-4 py-2 font-medium">
                  {text.day}
                </th>
                {MODELS.map((m) => (
                  <th key={m.id} scope="col" className="px-2 py-2 text-right font-medium">
                    {text.modelHigh(m.label, labels.temperature)}
                  </th>
                ))}
                {MODELS.map((m) => (
                  <th key={m.id} scope="col" className="px-2 py-2 text-right font-medium">
                    {text.modelRain(m.label, labels.precipitation)}
                  </th>
                ))}
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {text.confidence}
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {days.map((day) => (
                <tr key={day.date} className="border-t border-border/60">
                  <th scope="row" className="px-4 py-1.5 text-left font-normal">
                    {formatWeekday(day.date, "short", locale)} {formatDayMonth(day.date, locale)}
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
                    {day.level ? text.levels[day.level] : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground select-none">
          {text.howCalculated}
        </summary>
        <p className="mt-2 max-w-prose">
          {text.explanation(
            CONFIDENCE_THRESHOLDS.highMaxSpread,
            CONFIDENCE_THRESHOLDS.mediumMaxSpread,
          )}{" "}
          <Link
            href="/about#confidence"
            className="underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {text.moreOnMethods}
          </Link>
          .
        </p>
      </details>
    </div>
  );
}
