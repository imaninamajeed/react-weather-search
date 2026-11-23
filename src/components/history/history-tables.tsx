import { formatDayMonth, formatMonthName, formatWeekday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { convertPrecipitation, convertTemperature, unitLabels } from "@/lib/units";
import type { DayComparison, MonthComparison } from "@/lib/weather/climate";
import type { Units } from "@/lib/weather/types";

const wrapper = "relative max-h-80 overflow-auto border-t border-border";
const th = "px-2 py-2 text-right font-medium";

/** Data twins for both history charts. */
export async function HistoryTables({
  days,
  months,
  units,
}: {
  days: DayComparison[];
  months: MonthComparison[];
  units: Units;
}) {
  const { locale, t } = await getI18n();
  const text = t.place.history.tables;
  const labels = unitLabels(units);

  return (
    <div className="space-y-3 fit:grid fit:grid-cols-2 fit:items-start fit:gap-2 fit:space-y-0">
      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium select-none">
          {text.monthlyView}
        </summary>
        <div className={wrapper} tabIndex={0} role="region" aria-label={text.monthlyRegion}>
          <table className="w-full text-sm">
            <caption className="sr-only">{text.monthlyCaption}</caption>
            <thead className="sticky top-0 bg-card">
              <tr className="label-caps text-left">
                <th scope="col" className="px-4 py-2 font-medium">
                  {text.month}
                </th>
                <th scope="col" className={th}>
                  {text.actual(labels.precipitation)}
                </th>
                <th scope="col" className={th}>
                  {text.normal(labels.precipitation)}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {text.ofNormal}
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {months.map((month) => (
                <tr key={month.month} className="border-t border-border/60">
                  <th scope="row" className="px-4 py-1.5 text-left font-normal">
                    {formatMonthName(Number(month.month.slice(5, 7)), "long", locale)}{" "}
                    {month.month.slice(0, 4)}
                    {month.coverage < 1 && text.soFar}
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
          {text.dailyView}
        </summary>
        <div className={wrapper} tabIndex={0} role="region" aria-label={text.dailyRegion}>
          <table className="w-full text-sm">
            <caption className="sr-only">{text.dailyCaption}</caption>
            <thead className="sticky top-0 bg-card">
              <tr className="label-caps text-left">
                <th scope="col" className="px-4 py-2 font-medium">
                  {text.day}
                </th>
                <th scope="col" className={th}>
                  {text.high(labels.temperature)}
                </th>
                <th scope="col" className={th}>
                  {text.normalLow(labels.temperature)}
                </th>
                <th scope="col" className={th}>
                  {text.normalMedian(labels.temperature)}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {text.normalHigh(labels.temperature)}
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {days.map((day) => (
                <tr key={day.date} className="border-t border-border/60">
                  <th scope="row" className="px-4 py-1.5 text-left font-normal">
                    {formatWeekday(day.date, "short", locale)} {formatDayMonth(day.date, locale)},{" "}
                    {day.date.slice(0, 4)}
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
