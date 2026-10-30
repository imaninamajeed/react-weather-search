/**
 * A hand-sized trend line: the shape of a series, with no axes. It exists so a row of place tiles can
 * be compared by shape at a glance (rising, falling, peaking this afternoon) before reading a number.
 *
 * The vertical scale never spans less than `minSpan` (in the series' own unit; °C for the tiles), and
 * a narrower series is centred in it. Without that every line stretches to fill its box, and a 2°
 * swing looks as dramatic as a 15° one.
 */
export function Sparkline({
  values,
  label,
  minSpan = 8,
}: {
  values: number[];
  label: string;
  minSpan?: number;
}) {
  const width = 120;
  const height = 32;
  const pad = 3;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = Math.max(high - low, minSpan);
  const min = (low + high) / 2 - span / 2;
  const line = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = pad + (1 - (value - min) / span) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-8 w-full overflow-visible"
    >
      <path
        d={`${line} L${width} ${height} L0 ${height} Z`}
        fill="var(--chart-1)"
        fillOpacity={0.12}
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
  );
}
