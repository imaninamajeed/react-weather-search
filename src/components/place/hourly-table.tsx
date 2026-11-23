import { formatHour, formatWeekday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { convertPrecipitation, convertSpeed, convertTemperature, unitLabels } from "@/lib/units";
import type { HourlyPoint, Units } from "@/lib/weather/types";

/** The chart's data twin: every plotted value, readable without a pointer or colour vision. */
export async function HourlyTable({ hours, units }: { hours: HourlyPoint[]; units: Units }) {
  const { locale, t } = await getI18n();
  const text = t.place.hourly.table;
  const labels = unitLabels(units);
  return (
    <details className="group mt-4 overflow-hidden rounded-2xl border border-border">
      <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium select-none fit:py-1.5">
        {text.view}
      </summary>
      <div
        className="relative max-h-80 overflow-auto border-t border-border"
        tabIndex={0}
        role="region"
        aria-label={text.region}
      >
        <table className="w-full text-sm">
          <caption className="sr-only">{text.caption(hours.length)}</caption>
          <thead className="sticky top-0 bg-card text-left">
            <tr className="label-caps">
              <th scope="col" className="px-4 py-2 font-medium">
                {text.time}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                {text.temperature(labels.temperature)}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                {text.feels(labels.temperature)}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                {text.rainPercent}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                {text.rain(labels.precipitation)}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                {text.wind(labels.speed)}
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                {text.gusts(labels.speed)}
              </th>
            </tr>
          </thead>
          <tbody className="tnum">
            {hours.map((hour) => (
              <tr key={hour.time} className="border-t border-border/60">
                <th scope="row" className="px-4 py-1.5 text-left font-normal">
                  {formatWeekday(hour.time, "short", locale)} {formatHour(hour.time, locale)}
                </th>
                <td className="px-2 py-1.5 text-right">
                  {Math.round(convertTemperature(hour.temperature, units))}°
                </td>
                <td className="px-2 py-1.5 text-right">
                  {Math.round(convertTemperature(hour.apparentTemperature, units))}°
                </td>
                <td className="px-2 py-1.5 text-right">{hour.precipitationProbability}</td>
                <td className="px-2 py-1.5 text-right">
                  {convertPrecipitation(hour.precipitation, units).toFixed(
                    units === "imperial" ? 2 : 1,
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {Math.round(convertSpeed(hour.windSpeed, units))}
                </td>
                <td className="px-4 py-1.5 text-right">
                  {Math.round(convertSpeed(hour.windGusts, units))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
