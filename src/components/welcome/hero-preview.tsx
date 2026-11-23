"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { smoothPath, type Point } from "./curves";

// The three models' daily highs over a week, as in the social image: they agree for three days,
// then fan out. Each keeps its colour from the outlook's confidence chart.
const RUNS = [
  { label: "ECMWF", colour: "var(--chart-3)", highs: [30.8, 31, 30.6, 30.8, 30.6, 30.9, 30.5] },
  { label: "GFS", colour: "var(--chart-2)", highs: [30.8, 31, 30.7, 31.3, 31.9, 32.4, 32.9] },
  { label: "ICON", colour: "var(--chart-4)", highs: [30.7, 30.9, 30.5, 30.2, 29.6, 29, 28.6] },
];
const VERDICT = ["high", "high", "high", "medium", "medium", "low", "low"] as const;
const VERDICT_COLOUR = {
  high: "var(--brand-teal-text)",
  medium: "var(--advisory)",
  low: "var(--brand-magenta)",
};

const x = (day: number) => 12 + day * 28.6;
const y = (temperature: number) => 36 - (temperature - 30.7) * 10.5;
const LINES = RUNS.map((run) => ({
  ...run,
  d: smoothPath(run.highs.map((t, day) => [x(day), y(t)])),
}));
// The spread between the coolest and warmest model, padded a little either side.
const BAND = (() => {
  const days = RUNS[0].highs.map((_, day) => RUNS.map((run) => run.highs[day]));
  const top = days.map((temps, day): Point => [x(day), y(Math.max(...temps)) - 3]);
  const bottom = days.map((temps, day): Point => [x(day), y(Math.min(...temps)) + 3]).reverse();
  return `${smoothPath(top)}L${smoothPath(bottom).slice(1)}Z`;
})();

// Frosted cards, so the chart behind shows through.
const glass = "bg-card/70 ring-foreground/15 backdrop-blur-md";
// A brand colour pulled towards the text colour (darker in light mode, lighter in dark), for small text.
export const legible = (colour: string) => `color-mix(in oklch, ${colour} 75%, var(--foreground))`;

/**
 * Three of the app's cards over the hero's storm: forecast confidence, an alert and the weather
 * now, with made-up numbers. One image to assistive tech, described by its label.
 */
export function HeroPreview({ className }: { className?: string }) {
  const text = useMessages().welcome.preview;
  return (
    <div role="img" aria-label={text.label} className={cn("grid w-full max-w-sm gap-3", className)}>
      <Card size="sm" className={cn(glass, "lg:ml-10")}>
        <CardHeader>
          <CardTitle className="label-caps">{text.confidence}</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 196 80" className="w-full overflow-visible">
            <path d={BAND} fill="currentColor" fillOpacity={0.07} />
            {LINES.map((line) => (
              <path
                key={line.label}
                d={line.d}
                fill="none"
                stroke={line.colour}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            ))}
            {VERDICT.map((level, day) => (
              <rect
                key={day}
                x={x(day) - 11}
                y={72}
                width={22}
                height={4}
                rx={2}
                fill={VERDICT_COLOUR[level]}
              />
            ))}
          </svg>
          <div className="mt-1 flex justify-between font-heading text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
            <span style={{ color: legible(VERDICT_COLOUR.high) }}>{text.high}</span>
            <span style={{ color: legible(VERDICT_COLOUR.low) }}>{text.low}</span>
          </div>
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
            {RUNS.map((run) => (
              <span key={run.label} className="inline-flex items-center gap-1.5">
                <span
                  className="h-0.5 w-2.5 rounded-full"
                  style={{ backgroundColor: run.colour }}
                />
                {run.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-start gap-3 lg:-ml-4 lg:pt-6">
        {/* Coloured as the app's hazard badges are, so it reads on either surface. */}
        <Badge
          className="h-8 gap-2 bg-advisory px-3 text-sm text-advisory-foreground"
          style={{
            boxShadow: "0 0 24px -4px color-mix(in oklch, var(--advisory) 60%, transparent)",
          }}
        >
          <IconAlertTriangle />
          {text.advisory}
          <span className="font-normal">{text.until}</span>
        </Badge>

        <Card size="sm" className={cn(glass, "w-full")}>
          <CardContent>
            <p className="label-caps">{text.example}</p>
            <div className="mt-2 flex items-center gap-3">
              <WeatherIcon name="rain" className="size-10" />
              <p className="tnum font-heading text-5xl leading-none font-semibold tracking-tight">
                26
                <sup className="ml-0.5 text-xl font-medium text-muted-foreground">°C</sup>
              </p>
            </div>
            <p className="mt-2 text-sm">{text.summary}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
