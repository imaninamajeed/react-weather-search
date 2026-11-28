import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { WeatherIconName } from "@/lib/weather/codes";

/*
 * The app's own weather illustrations, drawn on a 64-unit grid from a handful of parts (sun, moon,
 * cloud, drops, flakes, bolt, fog). Every colour is a token (--icon-*, globals.css), so the set
 * follows the theme. Shapes are bold and two-toned (a body and a shade on its underside) so they still
 * read at 16 px in a strip; the hero adds slow motion, only when the visitor allows it.
 *
 * Server-safe: no hooks, no ids, so any number can share a page.
 */

type Tone = "light" | "dark";

const CLOUD_FILL: Record<Tone, [body: string, shade: string]> = {
  light: ["var(--icon-cloud)", "var(--icon-cloud-shade)"],
  dark: ["var(--icon-cloud-dark)", "var(--icon-cloud-dark-shade)"],
};

/** The cloud's outline in its own 44 × 28 box: a flat base and three domes. */
function CloudShape({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <rect x="0" y="14" width="44" height="14" rx="7" />
      <circle cx="12" cy="16" r="9" />
      <circle cx="24" cy="12" r="12" />
      <circle cx="35" cy="17" r="8" />
    </g>
  );
}

/** A cloud with a shaded underside, placed by its top-left corner and scaled from 44 × 28. */
export function Cloud({
  x,
  y,
  scale = 1,
  tone = "light",
  body,
  shade,
  className,
}: {
  x: number;
  y: number;
  scale?: number;
  tone?: Tone;
  /** Override the fills, e.g. with a sky's own cloud colours. */
  body?: string;
  shade?: string;
  className?: string;
}) {
  const [toneBody, toneShade] = CLOUD_FILL[tone];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={className}>
        <g transform="translate(0 2.5)">
          <CloudShape fill={shade ?? toneShade} />
        </g>
        <CloudShape fill={body ?? toneBody} />
      </g>
    </g>
  );
}

/** The sun: a two-tone disc and eight rounded rays. */
export function Sun({
  cx,
  cy,
  r,
  animated = false,
}: {
  cx: number;
  cy: number;
  r: number;
  animated?: boolean;
}) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    const from = r + r * 0.38;
    const to = r + r * 0.75;
    const round = (v: number) => Math.round(v * 100) / 100;
    return (
      <line
        key={i}
        x1={round(cx + Math.cos(angle) * from)}
        y1={round(cy + Math.sin(angle) * from)}
        x2={round(cx + Math.cos(angle) * to)}
        y2={round(cy + Math.sin(angle) * to)}
      />
    );
  });
  return (
    <g>
      <g
        stroke="var(--icon-sun)"
        strokeWidth={Math.max(3, r * 0.32)}
        strokeLinecap="round"
        className={cn(
          animated &&
            "origin-center [transform-box:fill-box] motion-safe:animate-[sky-spin_40s_linear_infinite]",
        )}
      >
        {rays}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="var(--icon-sun-shade)" />
      <circle cx={cx - r * 0.08} cy={cy - r * 0.08} r={r * 0.88} fill="var(--icon-sun)" />
    </g>
  );
}

/**
 * A crescent: the disc of radius r minus a second disc shifted up and to the right. The path runs
 * along the outer edge between the two discs' crossings, then back along the inner one.
 */
function crescentPath(cx: number, cy: number, r: number) {
  const [ox, oy, r2] = [cx + r * 0.5, cy - r * 0.38, r * 0.82];
  const dx = ox - cx;
  const dy = oy - cy;
  const d = Math.hypot(dx, dy);
  const a = (r * r - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r * r - a * a);
  const [mx, my] = [cx + (a * dx) / d, cy + (a * dy) / d];
  const p1 = [mx + (h * dy) / d, my - (h * dx) / d];
  const p2 = [mx - (h * dy) / d, my + (h * dx) / d];
  const f = (v: number) => Math.round(v * 100) / 100;
  return `M${f(p1[0])} ${f(p1[1])}A${r} ${r} 0 1 0 ${f(p2[0])} ${f(p2[1])}A${f(r2)} ${f(r2)} 0 0 1 ${f(p1[0])} ${f(p1[1])}Z`;
}

/** A crescent moon with a shaded rim. */
export function Moon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <path d={crescentPath(cx, cy, r)} fill="var(--icon-moon-shade)" />
      <path d={crescentPath(cx - r * 0.06, cy - r * 0.04, r * 0.9)} fill="var(--icon-moon)" />
    </g>
  );
}

const FALL = "motion-safe:animate-[icon-fall_1.6s_ease-in_infinite] [animation-delay:var(--delay)]";

/** Rain or drizzle: short slanted strokes under a cloud. */
function Drops({
  xs,
  y,
  length,
  animated,
}: {
  xs: number[];
  y: number;
  length: number;
  animated: boolean;
}) {
  return (
    <g stroke="var(--icon-rain)" strokeWidth="4" strokeLinecap="round">
      {xs.map((x, i) => (
        <line
          key={x}
          x1={x}
          y1={y + (i % 2) * 3}
          x2={x - length * 0.35}
          y2={y + (i % 2) * 3 + length}
          className={cn(animated && FALL)}
          style={animated ? ({ "--delay": `${i * 0.35}s` } as CSSProperties) : undefined}
        />
      ))}
    </g>
  );
}

/** Snow or hail: round flakes or pellets. */
function Flakes({
  points,
  r,
  fill = "var(--icon-snow)",
  animated,
}: {
  points: [number, number][];
  r: number;
  fill?: string;
  animated: boolean;
}) {
  return (
    <g fill={fill}>
      {points.map(([x, y], i) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={r}
          className={cn(animated && FALL)}
          style={animated ? ({ "--delay": `${i * 0.3}s` } as CSSProperties) : undefined}
        />
      ))}
    </g>
  );
}

function Bolt() {
  return (
    <path
      d="M35 40 25 54h7l-4 10 13-16h-7l4-8Z"
      fill="var(--icon-bolt)"
      stroke="var(--icon-sun-shade)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  );
}

function FogBands() {
  return (
    <g stroke="var(--icon-fog)" strokeWidth="4" strokeLinecap="round">
      <line x1="12" y1="45" x2="52" y2="45" />
      <line x1="18" y1="52" x2="46" y2="52" />
      <line x1="14" y1="59" x2="40" y2="59" />
    </g>
  );
}

const DRIFT = "motion-safe:animate-[float_6s_ease-in-out_infinite]";

/** The parts that make up each condition, inside a 64 × 64 viewBox. */
export function WeatherGlyph({
  name,
  animated = false,
}: {
  name: WeatherIconName;
  animated?: boolean;
}): ReactNode {
  const drift = animated ? DRIFT : undefined;
  // A raised cloud leaves room for what falls from it.
  const raised = (tone: Tone = "light") => <Cloud x={10} y={8} tone={tone} className={drift} />;

  switch (name) {
    case "clear-day":
      return <Sun cx={32} cy={32} r={14} animated={animated} />;
    case "clear-night":
      return <Moon cx={32} cy={33} r={20} />;
    case "partly-cloudy-day":
      return (
        <>
          <Sun cx={24} cy={23} r={10.5} animated={animated} />
          <Cloud x={15} y={29} scale={0.93} className={drift} />
        </>
      );
    case "partly-cloudy-night":
      return (
        <>
          <Moon cx={25} cy={24} r={14} />
          <Cloud x={15} y={29} scale={0.93} className={drift} />
        </>
      );
    case "cloudy":
      return (
        <>
          <Cloud
            x={22}
            y={13}
            scale={0.72}
            body="var(--icon-cloud-shade)"
            shade="var(--icon-cloud-dark-shade)"
          />
          <Cloud x={8} y={23} className={drift} />
        </>
      );
    case "fog":
      return (
        <>
          <Cloud x={10} y={8} scale={0.9} className={drift} />
          <FogBands />
        </>
      );
    case "drizzle":
      return (
        <>
          {raised()}
          <Drops xs={[22, 33, 44]} y={45} length={5} animated={animated} />
        </>
      );
    case "rain":
      return (
        <>
          {raised("dark")}
          <Drops xs={[22, 33, 44]} y={44} length={11} animated={animated} />
        </>
      );
    case "freezing-rain":
      return (
        <>
          {raised()}
          <Drops xs={[22, 44]} y={44} length={10} animated={animated} />
          <Flakes points={[[32, 52]]} r={3.2} animated={animated} />
        </>
      );
    case "snow":
      return (
        <>
          {raised()}
          <Flakes
            points={[
              [21, 47],
              [33, 50],
              [45, 47],
              [27, 58],
              [39, 58],
            ]}
            r={3}
            animated={animated}
          />
        </>
      );
    case "thunderstorm":
      return (
        <>
          <Bolt />
          {raised("dark")}
        </>
      );
    case "hail":
      return (
        <>
          {raised("dark")}
          <Flakes
            points={[
              [21, 49],
              [33, 55],
              [45, 49],
            ]}
            r={3.6}
            animated={animated}
          />
        </>
      );
  }
}
