"use client";

import { useMemo } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { formatDayMonth, formatWeekday } from "@/lib/format";
import { convertPrecipitation, convertTemperature, unitLabels } from "@/lib/units";
import type { DayComparison, MonthComparison } from "@/lib/weather/climate";
import type { Units } from "@/lib/weather/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthName = (month: string) => MONTHS[Number(month.slice(5, 7)) - 1];
const round1 = (value: number) => Math.round(value * 10) / 10;

interface DayRow {
  date: string;
  actual: number | null;
  median: number;
  band: [number, number];
}

function LegendItem({ children, swatch }: { children: string; swatch: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true">{swatch}</span>
      {children}
    </li>
  );
}

export function DailyHighsChart({ days, units }: { days: DayComparison[]; units: Units }) {
  const labels = unitLabels(units);
  const rows: DayRow[] = useMemo(
    () =>
      days.map((day) => ({
        date: day.date,
        actual:
          day.temperatureMax === null
            ? null
            : round1(convertTemperature(day.temperatureMax, units)),
        median: round1(convertTemperature(day.normalMedian, units)),
        band: [
          round1(convertTemperature(day.normalLow, units)),
          round1(convertTemperature(day.normalHigh, units)),
        ],
      })),
    [days, units],
  );
  // One tick per month, at its first day.
  const ticks = rows.filter((row) => row.date.endsWith("-01")).map((row) => row.date);
  const config = { actual: { label: "Daily high", color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <div className="fit:flex fit:h-full fit:min-h-0 fit:flex-col">
      <ul
        className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground fit:mb-2"
        aria-label="Legend"
      >
        <LegendItem
          swatch={
            <span
              className="inline-block w-5 border-t-2"
              style={{ borderColor: "var(--chart-1)" }}
            />
          }
        >
          Daily high
        </LegendItem>
        <LegendItem
          swatch={
            <span
              className="inline-block w-5 border-t-2 border-dashed"
              style={{ borderColor: "var(--muted-foreground)" }}
            />
          }
        >
          Normal (median)
        </LegendItem>
        <LegendItem
          swatch={<span className="inline-block h-2.5 w-5 rounded-sm bg-foreground/10" />}
        >
          Normal range (middle 80%)
        </LegendItem>
      </ul>

      <div
        role="group"
        className="fit:min-h-36 fit:flex-1"
        aria-label={`Daily high temperature for the last ${rows.length} days compared with the normal range. A table with every value follows the charts.`}
      >
        <ChartContainer config={config} className="aspect-auto h-72 w-full fit:h-full fit:min-h-0">
          <ComposedChart
            data={rows}
            margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={(date: string) => monthName(date)}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={8}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(value: number) => `${value}°`}
              domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
              content={<DayTooltip />}
            />
            <Area
              dataKey="band"
              stroke="none"
              fill="var(--foreground)"
              fillOpacity={0.1}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="median"
              stroke="var(--muted-foreground)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="actual"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Temperatures in {labels.temperature}. The band covers the middle 80% of daily highs on the
        same calendar day in 1991–2020.
      </p>
    </div>
  );
}

function DayTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: DayRow }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const delta = row.actual === null ? null : round1(row.actual - row.median);

  return (
    <div className="min-w-44 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-popover-foreground">
        {formatWeekday(row.date)} {formatDayMonth(row.date)}
      </p>
      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block w-3 border-t-2"
            style={{ borderColor: "var(--chart-1)" }}
          />
          <span className="text-sm font-semibold text-popover-foreground">
            {row.actual === null ? "—" : `${Math.round(row.actual)}°`}
          </span>
          <span className="text-muted-foreground">
            High
            {delta !== null && delta !== 0
              ? ` (${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}° vs normal)`
              : ""}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block w-3 border-t-2 border-dashed"
            style={{ borderColor: "var(--muted-foreground)" }}
          />
          <span className="text-sm font-semibold text-popover-foreground">
            {Math.round(row.median)}°
          </span>
          <span className="text-muted-foreground">
            Normal ({Math.round(row.band[0])}–{Math.round(row.band[1])}°)
          </span>
        </li>
      </ul>
    </div>
  );
}

interface MonthRow {
  month: string;
  label: string;
  actual: number;
  normal: number;
  partial: boolean;
}

export function MonthlyRainChart({ months, units }: { months: MonthComparison[]; units: Units }) {
  const labels = unitLabels(units);
  const rows: MonthRow[] = useMemo(
    () =>
      months.map((month) => ({
        month: month.month,
        label: monthName(month.month),
        actual: round1(convertPrecipitation(month.actual, units)),
        normal: round1(convertPrecipitation(month.normal, units)),
        partial: month.coverage < 1,
      })),
    [months, units],
  );
  const config = {
    normal: { label: "Normal", color: "var(--muted-foreground)" },
    actual: { label: "Actual", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  return (
    <div className="fit:flex fit:h-full fit:min-h-0 fit:flex-col">
      <ul
        className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground fit:mb-2"
        aria-label="Legend"
      >
        <LegendItem
          swatch={
            <span
              className="inline-block h-2.5 w-5 rounded-sm"
              style={{ background: "var(--chart-3)" }}
            />
          }
        >
          Rainfall
        </LegendItem>
        <LegendItem
          swatch={<span className="inline-block h-2.5 w-5 rounded-sm bg-foreground/25" />}
        >
          Normal for the period
        </LegendItem>
      </ul>

      <div
        role="group"
        className="fit:min-h-36 fit:flex-1"
        aria-label="Monthly rainfall for the last twelve months compared with normal. A table with every value follows."
      >
        <ChartContainer config={config} className="aspect-auto h-64 w-full fit:h-full fit:min-h-0">
          <BarChart
            data={rows}
            margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
            barGap={2}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={8}
            />
            <YAxis width={44} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip
              cursor={{ fill: "var(--foreground)", fillOpacity: 0.05 }}
              content={<MonthTooltip unit={labels.precipitation} />}
            />
            <Bar
              dataKey="normal"
              fill="var(--foreground)"
              fillOpacity={0.25}
              maxBarSize={14}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="actual"
              fill="var(--chart-3)"
              maxBarSize={14}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground fit:hidden">
        Rainfall in {labels.precipitation} per month. The latest month is still in progress, so its
        normal covers only the days so far.
      </p>
    </div>
  );
}

function MonthTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: MonthRow }>;
  unit: string;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const year = row.month.slice(0, 4);

  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-popover-foreground">
        {row.label} {year}
        {row.partial && <span className="font-normal text-muted-foreground"> (so far)</span>}
      </p>
      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: "var(--chart-3)" }}
          />
          <span className="text-sm font-semibold text-popover-foreground">
            {row.actual} {unit}
          </span>
          <span className="text-muted-foreground">Actual</span>
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2 w-3 rounded-sm bg-foreground/25" />
          <span className="text-sm font-semibold text-popover-foreground">
            {row.normal} {unit}
          </span>
          <span className="text-muted-foreground">Normal</span>
        </li>
      </ul>
    </div>
  );
}
