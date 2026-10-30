import { useId, type CSSProperties, type SVGProps } from "react";
import { cn } from "@/lib/utils";

/*
 * The Isobar mark: the closed isobars around the low in design/og-image.html, on the same ink and
 * pressure ramp (magenta at the core, teal outside). Each ring is an exact contour of that low's
 * pressure formula, scaled to a set size and nudged down-left so the system leans the way the
 * fronts run. The white core is both the low's centre and "your location".
 *
 * Three optical sizes, one shape:
 *   full     48 px and up: app icons, splash screens, the social image
 *   compact  24–47 px: the top bar
 *   small    up to 23 px: the browser tab
 * Static icons (favicon, apple-icon, PWA icons) are rendered from this component by
 * scripts/brand-icons.mjs, so change it here and re-run that script.
 */

const INK = "#06090c";
const MAGENTA = "#ff2d95";
const TEAL = "#2de2c8";

type Ring = { size: number; colour: string; width: number; turn: number };
type Detail = {
  core: [number, number];
  coreRadius: number;
  scale: number;
  drift: [number, number];
  glow: number;
  grid: boolean;
  rings: Ring[];
};

// `size` is the contour's square-root pressure term (radius grows linearly with it); `turn` is how
// far each ring swings on hover, anticlockwise like a northern-hemisphere low, inner rings most.
const DETAILS = {
  full: {
    core: [300, 205],
    coreRadius: 17,
    scale: 0.9,
    drift: [-16, 18],
    glow: 9,
    grid: true,
    rings: [
      { size: 0.3, colour: MAGENTA, width: 22, turn: -30 },
      { size: 0.62, colour: "#d65cff", width: 18, turn: -21 },
      { size: 0.96, colour: "#7884ff", width: 16, turn: -14 },
      { size: 1.32, colour: TEAL, width: 14, turn: -8 },
    ],
  },
  compact: {
    core: [300, 205],
    coreRadius: 26,
    scale: 0.95,
    drift: [-18, 22],
    glow: 9,
    grid: false,
    rings: [
      { size: 0.34, colour: MAGENTA, width: 30, turn: -30 },
      { size: 0.74, colour: "#a77bff", width: 26, turn: -19 },
      { size: 1.16, colour: TEAL, width: 24, turn: -10 },
    ],
  },
  small: {
    core: [288, 215],
    coreRadius: 42,
    scale: 1,
    drift: [-24, 30],
    glow: 0,
    grid: false,
    rings: [
      { size: 0.4, colour: MAGENTA, width: 48, turn: -30 },
      { size: 0.98, colour: TEAL, width: 42, turn: -14 },
    ],
  },
} satisfies Record<string, Detail>;

export type IsobarMarkDetail = keyof typeof DETAILS;

/**
 * One isobar of the low, centred on it, in the OG image's pixel space. The low's pressure is
 * 1014 - depth / (1 + q), with q quadratic in the offset after a tilt and a radius-dependent twist,
 * so a contour solves to a radius per angle in closed form.
 */
export function isobar(size: number, points = 16): [number, number][] {
  const tilt = -0.42;
  return Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    const g =
      ((Math.cos(angle) / 235) ** 2 + (Math.sin(angle) / 180) ** 2) *
      (1 + 0.13 * Math.sin(2 * angle + 1) + 0.08 * Math.sin(3 * angle - 0.5));
    const r = size / Math.sqrt(g);
    const back = -(tilt + 0.85 * Math.exp(-r / 240));
    const [u, v] = [r * Math.cos(angle), r * Math.sin(angle)];
    return [u * Math.cos(back) - v * Math.sin(back), u * Math.sin(back) + v * Math.cos(back)];
  });
}

// Closed Catmull-Rom spline through the points, as cubic Beziers.
export function closedPath(pts: [number, number][]) {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  const r = Math.round;
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)} ${r(p2[0])} ${r(p2[1])}`;
  }
  return `${d}Z`;
}

const PATHS = Object.fromEntries(
  Object.entries(DETAILS).map(([key, { core, scale, drift, rings }]) => [
    key,
    rings.map(({ size }, i) =>
      closedPath(
        isobar(size).map(([x, y]) => [
          core[0] + x * scale + drift[0] * i,
          core[1] + y * scale + drift[1] * i,
        ]),
      ),
    ),
  ]),
) as Record<IsobarMarkDetail, string[]>;

// A faint graticule, like the frame of a printed chart.
const GRID = Array.from({ length: 5 }, (_, i) => 64 + i * 96)
  .map((v) => `M${v} 0V512M0 ${v}H512`)
  .join("");

// Hover motion, written out in full so Tailwind finds the classes. The global reduced-motion rule
// would only shorten the transition, so the movement itself is gated on motion-safe.
const EASE = "transition-[rotate,scale] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";
const SWING =
  "motion-safe:group-hover/brand:rotate-(--turn) motion-safe:group-focus-visible/brand:rotate-(--turn)";
const SWELL =
  "motion-safe:group-hover/brand:scale-140 motion-safe:group-focus-visible/brand:scale-140";

type IsobarMarkProps = SVGProps<SVGSVGElement> & {
  detail?: IsobarMarkDetail;
  /** Full-bleed square, for platforms that apply their own mask (apple-icon, maskable). */
  square?: boolean;
  /** Swing the isobars when an ancestor with `group/brand` is hovered or focused. */
  animated?: boolean;
  /** Just the isobars: no tile, ink background, frame or white core, to lay under your own content. */
  bare?: boolean;
};

export function IsobarMark({
  detail = "full",
  square = false,
  animated = false,
  bare = false,
  className,
  ...props
}: IsobarMarkProps) {
  const id = useId();
  const { core, coreRadius, glow, grid, rings } = DETAILS[detail];
  const [cx, cy] = core;
  // Rotate and scale about the core, in viewBox units.
  const pivot: CSSProperties = { transformBox: "view-box", transformOrigin: `${cx}px ${cy}px` };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <clipPath id={`${id}tile`}>
          <rect width="512" height="512" rx={square ? 0 : 116} />
        </clipPath>
        <radialGradient id={`${id}high`} cx="20" cy="40" r="360" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={TEAL} stopOpacity="0.22" />
          <stop offset="1" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}low`} cx={cx} cy={cy} r="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={MAGENTA} stopOpacity="0.34" />
          <stop offset="1" stopColor={MAGENTA} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}halo`}>
          <stop offset="0" stopColor={MAGENTA} stopOpacity="0.75" />
          <stop offset="1" stopColor={MAGENTA} stopOpacity="0" />
        </radialGradient>
        {glow > 0 && (
          <filter id={`${id}glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g clipPath={bare ? undefined : `url(#${id}tile)`}>
        {!bare && <rect width="512" height="512" fill={INK} />}
        {!bare && <rect width="512" height="512" fill={`url(#${id}high)`} />}
        {!bare && <rect width="512" height="512" fill={`url(#${id}low)`} />}
        {grid && !bare && <path d={GRID} stroke="#fff" strokeOpacity="0.06" strokeWidth="3" />}
        <g fill="none" filter={glow > 0 ? `url(#${id}glow)` : undefined}>
          {rings.map((ring, i) => (
            <path
              key={ring.size}
              d={PATHS[detail][i]}
              stroke={ring.colour}
              strokeWidth={ring.width}
              className={animated ? cn(EASE, SWING) : undefined}
              style={
                animated ? ({ ...pivot, "--turn": `${ring.turn}deg` } as CSSProperties) : undefined
              }
            />
          ))}
        </g>
        {!bare && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={coreRadius * 2.6}
              fill={`url(#${id}halo)`}
              className={animated ? cn(EASE, SWELL) : undefined}
              style={animated ? pivot : undefined}
            />
            <circle cx={cx} cy={cy} r={coreRadius} fill="#fff" />
          </>
        )}
      </g>
      {!square && !bare && (
        <rect
          x="2"
          y="2"
          width="508"
          height="508"
          rx="114"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.14"
          strokeWidth="4"
        />
      )}
    </svg>
  );
}
