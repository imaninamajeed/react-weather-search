import { formatHour } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { formatTemperature } from "@/lib/units";
import type { Forecast, Units } from "@/lib/weather/types";

const HOURS = 24;
/** Hours between the labels under the curve. */
const TICK = 6;
const WIDTH = 600;
const HEIGHT = 100;
const PAD = 14;

/**
 * The next 24 hours as one temperature curve: where it is now, when it peaks, when it bottoms out.
 * The line and fill stretch with the card, but the dots and labels are laid over it as HTML at the
 * same percentages, so they are never squashed. The vertical scale never spans less than 6°, so a
 * flat day reads as flat.
 */
export async function HourlyCurve({ forecast, units }: { forecast: Forecast; units: Units }) {
  const { locale, t } = await getI18n();
  const points = forecast.hourly.slice(0, HOURS + 1);
  if (points.length < 2) return null;

  const temps = points.map((point) => point.temperature);
  const low = Math.min(...temps);
  const high = Math.max(...temps);
  const span = Math.max(high - low, 6);
  const min = (low + high) / 2 - span / 2;
  const x = (index: number) => (index / (points.length - 1)) * 100;
  const y = (value: number) => PAD + (1 - (value - min) / span) * (HEIGHT - PAD * 2);

  const line = temps
    .map(
      (value, index) =>
        `${index ? "L" : "M"}${((x(index) / 100) * WIDTH).toFixed(1)} ${y(value).toFixed(1)}`,
    )
    .join(" ");
  const marks = [
    { index: temps.indexOf(high), above: true },
    { index: temps.indexOf(low), above: false },
  ].filter((mark, i, all) => i === 0 || mark.index !== all[0].index);
  const ticks = Array.from({ length: Math.floor(HOURS / TICK) + 1 }, (_, i) => i * TICK).filter(
    (index) => index < points.length,
  );

  return (
    <figure
      aria-label={`${t.dashboard.nextHours(HOURS)}: ${formatTemperature(low, units)} – ${formatTemperature(high, units)}`}
      role="img"
    >
      <div aria-hidden="true" className="mx-3">
        <div className="relative h-28">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="size-full overflow-visible"
          >
            <path
              d={`${line} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`}
              fill="var(--chart-1)"
              fillOpacity={0.2}
            />
            <path
              d={line}
              fill="none"
              stroke="var(--chart-1)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {[{ index: 0, above: false, now: true }, ...marks].map(({ index, above, ...rest }) => (
            <span
              key={index}
              className="absolute"
              style={{ left: `${x(index)}%`, top: `${(y(temps[index]) / HEIGHT) * 100}%` }}
            >
              <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--chart-1) ring-2 ring-card" />
              {!("now" in rest) && (
                <span
                  className={`tnum absolute -translate-x-1/2 text-sm font-medium whitespace-nowrap ${above ? "-translate-y-[170%]" : "translate-y-[70%]"}`}
                >
                  {formatTemperature(temps[index], units)}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="relative mt-3 h-4 text-xs text-muted-foreground">
          {ticks.map((index) => (
            <span
              key={index}
              className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
              style={{ left: `${x(index)}%` }}
            >
              {index === 0 ? t.common.now : formatHour(points[index].time, locale)}
            </span>
          ))}
        </div>
        <div className="tnum mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t.dashboard.nextHours(HOURS)}</span>
          <span>
            {formatTemperature(low, units)} – {formatTemperature(high, units)}
          </span>
        </div>
      </div>
    </figure>
  );
}
