import { formatDayMonth, formatWeekday } from "@/lib/format";
import { convertPrecipitation, convertTemperature, unitLabels } from "@/lib/units";
import type { DayComparison, MonthComparison } from "@/lib/weather/climate";
import type { Units } from "@/lib/weather/types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const wrapper = "relative max-h-80 overflow-auto border-t border-border";
const th = "px-2 py-2 text-right font-medium";

/** Data twins for both history charts. */
export function HistoryTables({
  days,
  months,
  units,
}: {
  days: DayComparison[];
  months: MonthComparison[];
  units: Units;
}) {
  const labels = unitLabels(units);

  return (
    <div className="space-y-3">
      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium select-none">
          Monthly rainfall as a table
        </summary>
        <div className={wrapper} tabIndex={0} role="region" aria-label="Monthly rainfall table">
          <table className="w-full text-sm">
            <caption className="sr-only">Monthly rainfall against normal</caption>
            <thead className="sticky top-0 bg-card">
              <tr className="label-caps text-left">
                <th scope="col" className="px-4 py-2 font-medium">
                  Month
                </th>
                <th scope="col" className={th}>
                  Actual ({labels.precipitation})
                </th>
                <th scope="col" className={th}>
                  Normal ({labels.precipitation})
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Of normal
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {months.map((month) => (
                <tr key={month.month} className="border-t border-border/60">
                  <th scope="row" className="px-4 py-1.5 text-left font-normal">
                    {MONTHS[Number(month.month.slice(5, 7)) - 1]} {month.month.slice(0, 4)}
                    {month.coverage < 1 && " (so far)"}
                  </th>
                  <td className="px-2 py-1.5 text-right">
                    {convertPrecipitation(month.actual, units).toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {convertPrecipitation(month.normal, units).toFixed(1)}
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    {month.normal > 0 ? `${Math.round((month.actual / month.normal) * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium select-none">
          Daily highs as a table
        </summary>
        <div className={wrapper} tabIndex={0} role="region" aria-label="Daily highs table">
          <table className="w-full text-sm">
            <caption className="sr-only">Daily high temperature against the normal range</caption>
            <thead className="sticky top-0 bg-card">
              <tr className="label-caps text-left">
                <th scope="col" className="px-4 py-2 font-medium">
                  Day
                </th>
                <th scope="col" className={th}>
                  High ({labels.temperature})
                </th>
                <th scope="col" className={th}>
                  Normal low ({labels.temperature})
                </th>
                <th scope="col" className={th}>
                  Normal median ({labels.temperature})
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Normal high ({labels.temperature})
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {days.map((day) => (
                <tr key={day.date} className="border-t border-border/60">
                  <th scope="row" className="px-4 py-1.5 text-left font-normal">
                    {formatWeekday(day.date)} {formatDayMonth(day.date)}, {day.date.slice(0, 4)}
                  </th>
                  <td className="px-2 py-1.5 text-right">
                    {day.temperatureMax === null
                      ? "—"
                      : convertTemperature(day.temperatureMax, units).toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {convertTemperature(day.normalLow, units).toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {convertTemperature(day.normalMedian, units).toFixed(1)}
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    {convertTemperature(day.normalHigh, units).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
