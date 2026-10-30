"use client";

import { useMemo, useState } from "react";
import { Area, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDayMonth, formatWeekday } from "@/lib/format";
import { convertPrecipitation, convertTemperature, unitLabels } from "@/lib/units";
import { MODELS, type DayConfidence, type ModelId } from "@/lib/weather/confidence";
import type { Units } from "@/lib/weather/types";

type Metric = "temperature" | "rain";

// Model identity colours: blue, amber, green. Validated together with the all-pairs check
// because lines cross (see the note in globals.css).
const COLORS: Record<ModelId, string> = {
  ecmwf_ifs025: "var(--chart-3)",
  gfs_seamless: "var(--chart-2)",
  icon_seamless: "var(--chart-4)",
};

type Row = { date: string; band: [number, number] | null } & Partial<Record<ModelId, number>>;

export function ConfidenceChart({ days, units }: { days: DayConfidence[]; units: Units }) {
  const [metric, setMetric] = useState<Metric>("temperature");
  const labels = unitLabels(units);
  const convert = (value: number) =>
    Math.round(
      (metric === "temperature"
        ? convertTemperature(value, units)
        : convertPrecipitation(value, units)) * 100,
    ) / 100;

  const rows: Row[] = useMemo(
    () =>
      days.map((day) => {
        const source = metric === "temperature" ? day.temperatureMax : day.precipitation;
        const range = metric === "temperature" ? day.temperatureRange : day.rainRange;
        const row: Row = {
          date: day.date,
          band: range ? [convert(range[0]), convert(range[1])] : null,
        };
        for (const { id } of MODELS) {
          const value = source[id];
          if (value !== undefined) row[id] = convert(value);
        }
        return row;
      }),
    // `convert` is derived from metric and units.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, metric, units],
  );

  const config = Object.fromEntries(
    MODELS.map((m) => [m.id, { label: m.label, color: COLORS[m.id] }]),
  ) satisfies ChartConfig;
  const unit = metric === "temperature" ? labels.temperature : labels.precipitation;

  return (
    <div className="fit:flex fit:min-h-0 fit:min-h-40 fit:flex-1 fit:flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 fit:mb-2">
        <ToggleGroup
          type="single"
          value={metric}
          onValueChange={(value) => value && setMetric(value as Metric)}
          variant="outline"
          size="sm"
          aria-label="Chart metric"
        >
          <ToggleGroupItem value="temperature">High temperature</ToggleGroupItem>
          <ToggleGroupItem value="rain">Rainfall</ToggleGroupItem>
        </ToggleGroup>

        <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
          {MODELS.map((model) => (
            <li key={model.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block w-5 border-t-2"
                style={{ borderColor: COLORS[model.id] }}
              />
              {model.label}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-5 rounded-sm bg-foreground/10"
            />
            Spread
          </li>
        </ul>
      </div>

      <div
        role="group"
        className="fit:min-h-0 fit:flex-1"
        aria-label={`${metric === "temperature" ? "Daily high temperature" : "Daily rainfall"} predicted by ECMWF, GFS and ICON for the next ${rows.length} days. A table with every value follows the chart.`}
      >
        <ChartContainer config={config} className="aspect-auto h-64 w-full fit:h-full fit:min-h-0">
          <ComposedChart
            data={rows}
            margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(date: string) => formatWeekday(date)}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={8}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                metric === "temperature" ? `${value}°` : `${value}`
              }
              domain={
                metric === "temperature"
                  ? [(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]
                  : [0, (max: number) => Math.max(Math.ceil(max / 5) * 5, 5)]
              }
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
              content={<ModelTooltip metric={metric} unit={unit} />}
            />
            <Area
              dataKey="band"
              stroke="none"
              fill="var(--foreground)"
              fillOpacity={0.1}
              activeDot={false}
              isAnimationActive={false}
            />
            {MODELS.map((model) => (
              <Line
                key={model.id}
                dataKey={model.id}
                type="monotone"
                stroke={COLORS[model.id]}
                strokeWidth={2}
                dot={{ r: 4, fill: COLORS[model.id], stroke: "var(--card)", strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: Row }>;
  metric: Metric;
  unit: string;
}

function ModelTooltip({ active, payload, metric, unit }: TooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="min-w-36 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-popover-foreground">
        {formatWeekday(row.date)} {formatDayMonth(row.date)}
      </p>
      <ul className="space-y-1">
        {MODELS.filter((model) => row[model.id] !== undefined).map((model) => (
          <li key={model.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3 border-t-2"
              style={{ borderColor: COLORS[model.id] }}
            />
            <span className="text-sm font-semibold text-popover-foreground">
              {metric === "temperature"
                ? `${Math.round(row[model.id]!)}°`
                : `${row[model.id]!.toFixed(1)} ${unit}`}
            </span>
            <span className="text-muted-foreground">{model.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
