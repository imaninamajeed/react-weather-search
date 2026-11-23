import { IconSunrise } from "@tabler/icons-react";
import { getI18n } from "@/lib/i18n/server";
import { formatDuration, formatTime, minutesOfDay } from "@/lib/format";
import type { Forecast } from "@/lib/weather/types";
import { IconChip, PANEL } from "./tile";

// The arc is half an ellipse standing on the horizon line.
const CX = 160;
const BASE = 112;
const RX = 140;
const RY = 92;

/** A point on the arc, `progress` of the way from sunrise (0) to sunset (1). */
function pointAt(progress: number) {
  const angle = Math.PI * (1 - progress);
  return { x: CX + RX * Math.cos(angle), y: BASE - RY * Math.sin(angle) };
}

/**
 * Today's daylight as an arc from sunrise to sunset, with the sun where it is now. The sun is drawn
 * as the app mark's core: a white dot in a magenta halo. Everything it shows is also written out
 * beneath it, so the drawing itself is hidden from assistive tech.
 */
export async function SunArc({ forecast, className }: { forecast: Forecast; className?: string }) {
  const { locale, t } = await getI18n();
  const text = t.place.sun;
  const today = forecast.daily[0];
  const now = minutesOfDay(forecast.current.time);
  const rise = minutesOfDay(today.sunrise);
  const set = minutesOfDay(today.sunset);
  const raw = set > rise ? (now - rise) / (set - rise) : 0;
  const progress = Math.min(1, Math.max(0, raw));
  const up = raw > 0 && raw < 1;
  const sun = pointAt(progress);

  const status = up
    ? text.left(formatDuration((set - now) * 60, locale))
    : raw >= 1
      ? text.set
      : text.notUp;

  return (
    <div className={`${PANEL} ${className ?? ""}`}>
      <p className="label-caps flex items-center gap-2">
        <IconChip icon={IconSunrise} accent="var(--brand-magenta)" />
        {text.title}
      </p>
      <p className="mt-3 text-3xl leading-none font-semibold fit:mt-2 fit:text-2xl">
        {formatDuration(today.daylightSeconds, locale)}
        <span className="ml-2 text-base font-normal text-muted-foreground fit:hidden">
          {text.ofDaylight}
        </span>
      </p>

      <svg
        viewBox="0 0 320 128"
        aria-hidden="true"
        className="mx-auto mt-4 h-auto w-full max-w-sm overflow-visible fit:mt-3"
      >
        <defs>
          <linearGradient
            id="sun-arc-ramp"
            x1="20"
            x2="300"
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" style={{ stopColor: "var(--brand-teal-text)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--brand-violet)" }} />
            <stop offset="1" style={{ stopColor: "var(--brand-magenta)" }} />
          </linearGradient>
          <radialGradient id="sun-arc-halo">
            <stop offset="0" style={{ stopColor: "var(--brand-magenta)", stopOpacity: 0.7 }} />
            <stop offset="1" style={{ stopColor: "var(--brand-magenta)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <line
          x1="4"
          x2="316"
          y1={BASE}
          y2={BASE}
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
        <path
          d={`M ${CX - RX} ${BASE} A ${RX} ${RY} 0 0 1 ${CX + RX} ${BASE}`}
          pathLength="100"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="5"
          strokeDasharray="1 3"
          strokeLinecap="round"
        />
        {progress > 0 && (
          <path
            d={`M ${CX - RX} ${BASE} A ${RX} ${RY} 0 0 1 ${CX + RX} ${BASE}`}
            pathLength="100"
            fill="none"
            stroke="url(#sun-arc-ramp)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${progress * 100} 100`}
          />
        )}
        {up && (
          <>
            <circle cx={sun.x} cy={sun.y} r="22" fill="url(#sun-arc-halo)" />
            <circle
              cx={sun.x}
              cy={sun.y}
              r="8"
              fill="#fff"
              stroke="var(--brand-magenta)"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      <dl className="mt-1 grid grid-cols-2 gap-x-4 text-sm fit:text-xs">
        <div>
          <dt className="label-caps">{text.sunrise}</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatTime(today.sunrise, locale)}</dd>
        </div>
        <div className="text-right">
          <dt className="label-caps">{text.sunset}</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatTime(today.sunset, locale)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted-foreground fit:sr-only">{status}</p>
    </div>
  );
}
