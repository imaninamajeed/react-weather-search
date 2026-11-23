/**
 * Continuous temperature ramp, cold → hot, used by the range bars, the week-ahead
 * table and legends. It runs from the logo's turquoise through amber to its magenta.
 * Interpolated in OKLCH so lightness and chroma move smoothly between stops.
 */
const STOPS: ReadonlyArray<readonly [celsius: number, l: number, c: number, h: number]> = [
  [-10, 0.62, 0.14, 265],
  [0, 0.72, 0.12, 240],
  [10, 0.8, 0.11, 205],
  [18, 0.82, 0.13, 170],
  [25, 0.85, 0.16, 110],
  [30, 0.8, 0.17, 70],
  [35, 0.7, 0.21, 35],
  [40, 0.6, 0.25, 355],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolates hue along the shorter arc so 35° → 355° doesn't sweep through the whole wheel. */
function lerpHue(a: number, b: number, t: number) {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

export function temperatureColor(celsius: number): string {
  const first = STOPS[0];
  const last = STOPS[STOPS.length - 1];
  if (celsius <= first[0]) return `oklch(${first[1]} ${first[2]} ${first[3]})`;
  if (celsius >= last[0]) return `oklch(${last[1]} ${last[2]} ${last[3]})`;

  const upper = STOPS.findIndex(([stop]) => stop >= celsius);
  const [c0, l0, ch0, h0] = STOPS[upper - 1];
  const [c1, l1, ch1, h1] = STOPS[upper];
  const t = (celsius - c0) / (c1 - c0);
  return `oklch(${lerp(l0, l1, t).toFixed(3)} ${lerp(ch0, ch1, t).toFixed(3)} ${lerpHue(h0, h1, t).toFixed(1)})`;
}

/** CSS gradient covering [minC, maxC], for range bars. */
export function temperatureGradient(minC: number, maxC: number, steps = 6): string {
  const stops = Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    return `${temperatureColor(minC + (maxC - minC) * t)} ${Math.round(t * 100)}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
