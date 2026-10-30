export type Point = [number, number];
type Segment = [Point, Point, Point, Point];

export const formatPoint = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// Open Catmull-Rom spline through the points, as cubic Bezier segments (start, two controls, end).
function segments(pts: Point[]): Segment[] {
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  return pts.slice(0, -1).map((_, i) => {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    return [
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ];
  });
}

function cubic([a, b, c, d]: Segment, t: number): Point {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [
    w[0] * a[0] + w[1] * b[0] + w[2] * c[0] + w[3] * d[0],
    w[0] * a[1] + w[1] * b[1] + w[2] * c[1] + w[3] * d[1],
  ];
}

/** A smooth open curve through the points, as an SVG path. */
export function smoothPath(pts: Point[]) {
  return `M${formatPoint(pts[0])}${segments(pts)
    .map(([, b, c, d]) => `C${formatPoint(b)} ${formatPoint(c)} ${formatPoint(d)}`)
    .join("")}`;
}

/**
 * Points every `gap` units along the smooth curve through `pts`, each with its unit tangent, for
 * placing symbols along a line.
 */
export function pointsAlong(pts: Point[], gap: number, offset = gap / 2) {
  const dense = [
    ...segments(pts).flatMap((seg) => Array.from({ length: 40 }, (_, k) => cubic(seg, k / 40))),
    pts[pts.length - 1],
  ];
  const out: { at: Point; tangent: Point }[] = [];
  let walked = 0;
  let next = offset;
  for (let i = 1; i < dense.length; i++) {
    const [ax, ay] = dense[i - 1];
    const [bx, by] = dense[i];
    const step = Math.hypot(bx - ax, by - ay);
    if (step === 0) continue;
    while (walked + step >= next) {
      const t = (next - walked) / step;
      out.push({
        at: [ax + (bx - ax) * t, ay + (by - ay) * t],
        tangent: [(bx - ax) / step, (by - ay) / step],
      });
      next += gap;
    }
    walked += step;
  }
  return out;
}
