import { useId } from "react";
import { closedPath, isobar } from "@/components/shared/isobar-mark";
import { formatPoint, pointsAlong, smoothPath, type Point } from "./curves";

/*
 * The weather chart behind the welcome hero: the storm from design/og-image.html, in its 1200×630
 * pixel space. The isobars are exact contours of the same low as the app mark, every 4 hPa, on the
 * mark's pressure ramp (magenta at the core, teal outside; the deep teal on a light page). The fronts carry the standard synoptic
 * symbols on the side they are moving towards. Purely decorative.
 */

const LOW: Point = [840, 255];
const HIGH: Point = [150, 76];
const PIN: Point = [822, 471];
const OCCLUDED: Point[] = [
  [856, 270],
  [878, 292],
  [893, 326],
];
const COLD: Point[] = [
  [893, 326],
  [872, 398],
  [826, 466],
  [758, 532],
  [672, 592],
  [585, 650],
];
const WARM: Point[] = [
  [893, 326],
  [968, 352],
  [1048, 364],
  [1130, 368],
  [1250, 370],
];

// The low's pressure is 1014 - 32 / (1 + size²), so each level's contour size follows directly.
const contourSize = (level: number) => Math.sqrt(32 / (1014 - level) - 1);

const rampColour = (level: number) =>
  level <= 988
    ? "var(--brand-magenta)"
    : level <= 996
      ? "var(--brand-violet)"
      : level <= 1004
        ? "var(--brand-indigo)"
        : "var(--brand-teal-text)";

// Labels sit where each ring crosses a ray up and to the left of the low, as on a printed chart.
const LABEL_ANGLE = (-128 * Math.PI) / 180;
const offRay = ([x, y]: Point) => {
  const a = Math.atan2(y - LOW[1], x - LOW[0]);
  return Math.abs(Math.atan2(Math.sin(a - LABEL_ANGLE), Math.cos(a - LABEL_ANGLE)));
};

const ISOBARS = [984, 988, 992, 996, 1000, 1004, 1008].map((level) => {
  const points = isobar(contourSize(level), 24).map(([x, y]): Point => [LOW[0] + x, LOW[1] + y]);
  const k = points.reduce((best, p, i) => (offRay(p) < offRay(points[best]) ? i : best), 0);
  const [ax, ay] = points[(k + points.length - 1) % points.length];
  const [bx, by] = points[(k + 1) % points.length];
  // Keep the label upright whichever way the ring runs.
  let angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  const core = (1012 - level) / 28;
  return {
    level,
    d: closedPath(points),
    colour: rampColour(level),
    width: 1.1 + core * 1.1,
    opacity: 0.5 + core * 0.45,
    label: `translate(${formatPoint(points[k])}) rotate(${angle.toFixed(1)})`,
  };
});

/** Triangles for a cold front, semicircles for a warm one, alternating for an occlusion. */
function frontSymbols(pts: Point[], kind: "cold" | "warm" | "occluded", towards: Point, gap = 30) {
  const size = 8;
  return pointsAlong(pts, gap, gap * 0.6)
    .map(({ at: [x, y], tangent: [tx, ty] }, n) => {
      let [nx, ny] = [-ty, tx];
      if (nx * (towards[0] - x) + ny * (towards[1] - y) < 0) [nx, ny] = [-nx, -ny];
      const from = formatPoint([x - tx * size, y - ty * size]);
      const to = formatPoint([x + tx * size, y + ty * size]);
      const shape = kind === "occluded" ? (n % 2 ? "warm" : "cold") : kind;
      if (shape === "cold") {
        return `M${from}L${formatPoint([x + nx * size * 1.35, y + ny * size * 1.35])}L${to}Z`;
      }
      const sweep = tx * ny - ty * nx > 0 ? 1 : 0;
      return `M${from}A${size} ${size} 0 0 ${sweep} ${to}Z`;
    })
    .join("");
}

const FRONTS = [
  { pts: COLD, colour: "var(--brand-teal-text)", symbols: frontSymbols(COLD, "cold", [1100, 640]) },
  { pts: WARM, colour: "var(--brand-magenta)", symbols: frontSymbols(WARM, "warm", [1100, 0]) },
  {
    pts: OCCLUDED,
    colour: "var(--brand-violet)",
    symbols: frontSymbols(OCCLUDED, "occluded", [1000, 150], 26),
  },
].map((front) => ({ ...front, d: smoothPath(front.pts) }));

// A faint graticule, like the frame of a printed chart.
const GRID = [
  ...Array.from({ length: 12 }, (_, i) => `M${50 + i * 100} 0V630`),
  ...Array.from({ length: 7 }, (_, i) => `M0 ${15 + i * 100}H1200`),
].join("");

export function SynopticChart({ className }: { className?: string }) {
  const id = useId();
  const glow = `url(#${id}glow)`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 630"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <filter id={`${id}glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient
          id={`${id}low`}
          cx={LOW[0]}
          cy={LOW[1]}
          r="420"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: "var(--brand-magenta)", stopOpacity: 0.16 }} />
          <stop offset="1" style={{ stopColor: "var(--brand-magenta)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={`${id}high`} cx="120" cy="60" r="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--brand-teal)", stopOpacity: 0.13 }} />
          <stop offset="1" style={{ stopColor: "var(--brand-teal)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      <rect width="1200" height="630" fill={`url(#${id}high)`} />
      <rect width="1200" height="630" fill={`url(#${id}low)`} />
      <path d={GRID} stroke="currentColor" strokeOpacity={0.05} />

      <g fill="none" strokeLinecap="round" filter={glow}>
        {ISOBARS.map((ring) => (
          <path
            key={ring.level}
            d={ring.d}
            stroke={ring.colour}
            strokeWidth={ring.width}
            strokeOpacity={ring.opacity}
          />
        ))}
      </g>
      {/* An ink outline behind each label opens a gap in its ring. */}
      <g
        className="tnum font-heading"
        fontSize="11"
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
        stroke="var(--hero-bg, var(--brand-ink))"
        strokeWidth={6}
        paintOrder="stroke"
      >
        {ISOBARS.slice(0, -1).map((ring) => (
          <text key={ring.level} transform={ring.label} fill={ring.colour}>
            {ring.level}
          </text>
        ))}
      </g>

      {FRONTS.map((front) => (
        <g key={front.colour} filter={glow}>
          <path
            d={front.d}
            fill="none"
            stroke={front.colour}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <path d={front.symbols} fill={front.colour} />
        </g>
      ))}

      <g className="font-heading" textAnchor="middle" filter={glow}>
        <text x={LOW[0]} y={LOW[1] + 12} fontSize="40" fontWeight={700} fill="var(--brand-magenta)">
          L
        </text>
        <text x={LOW[0]} y={LOW[1] + 34} fontSize="12" fontWeight={600} fill="var(--brand-magenta)">
          982
        </text>
        <text
          x={HIGH[0]}
          y={HIGH[1] + 12}
          fontSize="40"
          fontWeight={700}
          fill="var(--brand-teal-text)"
        >
          H
        </text>
        <text
          x={HIGH[0]}
          y={HIGH[1] + 34}
          fontSize="12"
          fontWeight={600}
          fill="var(--brand-teal-text)"
        >
          1030
        </text>
      </g>

      {/* Your place, on the squall line. */}
      <g fill="none" stroke="currentColor" strokeWidth={1.2}>
        <circle cx={PIN[0]} cy={PIN[1]} r={30} strokeOpacity={0.12} />
        <circle cx={PIN[0]} cy={PIN[1]} r={20} strokeOpacity={0.22} />
        <circle
          cx={PIN[0]}
          cy={PIN[1]}
          r={11}
          strokeOpacity={0.4}
          className="origin-center transform-fill motion-safe:animate-ping"
        />
      </g>
      <circle cx={PIN[0]} cy={PIN[1]} r={5} fill="currentColor" filter={glow} />
    </svg>
  );
}
