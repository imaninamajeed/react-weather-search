import { IconWind } from "@tabler/icons-react";
import { compassPoint, convertSpeed, formatSpeed, unitLabels } from "@/lib/units";
import type { Forecast, Units } from "@/lib/weather/types";
import { IconChip, PANEL } from "./tile";

const POINTS = [
  { label: "N", x: 60, y: 14 },
  { label: "E", x: 106, y: 63 },
  { label: "S", x: 60, y: 112 },
  { label: "W", x: 14, y: 63 },
];

/**
 * Wind as a compass. The needle points where the wind is blowing *to*, opposite of the "from"
 * bearing everyone quotes, and its tail is lit in the app mark's magenta.
 */
export function WindCompass({
  forecast,
  units,
  className,
}: {
  forecast: Forecast;
  units: Units;
  className?: string;
}) {
  const { current } = forecast;
  const labels = unitLabels(units);
  const blowingTo = (current.windDirection + 180) % 360;

  return (
    <div className={`${PANEL} ${className ?? ""}`}>
      <p className="label-caps flex items-center gap-2">
        <IconChip icon={IconWind} accent="var(--brand-teal-text)" />
        Wind
      </p>
      <p className="mt-3 text-3xl leading-none font-semibold tabular-nums">
        {Math.round(convertSpeed(current.windSpeed, units))}
        <span className="ml-1 text-base font-normal text-muted-foreground">{labels.speed}</span>
      </p>

      <svg viewBox="0 0 120 126" aria-hidden="true" className="mx-auto mt-3 h-auto w-36">
        <defs>
          <linearGradient id="wind-needle" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--brand-teal-text)" }} />
            <stop offset="1" style={{ stopColor: "var(--brand-magenta)" }} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="63" r="44" fill="none" stroke="currentColor" strokeOpacity="0.18" />
        <circle
          cx="60"
          cy="63"
          r="32"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeDasharray="1 4"
        />
        {POINTS.map((point) => (
          <text
            key={point.label}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground font-mono text-[9px]"
          >
            {point.label}
          </text>
        ))}
        <g transform={`rotate(${blowingTo} 60 63)`}>
          <path d="M60 24 L67 63 L60 58 L53 63 Z" fill="url(#wind-needle)" />
          <path d="M60 102 L67 63 L60 68 L53 63 Z" fill="currentColor" fillOpacity="0.15" />
        </g>
        <circle
          cx="60"
          cy="63"
          r="3.5"
          fill="var(--card)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      <p className="mt-3 text-sm text-muted-foreground">
        From the {compassPoint(current.windDirection)} · gusts{" "}
        {formatSpeed(current.windGusts, units)}
      </p>
    </div>
  );
}
