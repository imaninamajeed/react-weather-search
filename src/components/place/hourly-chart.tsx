"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatHour, formatWeekday } from "@/lib/format";
import { convertPrecipitation, convertSpeed, convertTemperature, unitLabels } from "@/lib/units";
import type { HourlyPoint, Units } from "@/lib/weather/types";

type Metric = "temperature" | "rain" | "wind";

interface Row {
  time: string;
  isDay: boolean;
  temperature: number;
  feelsLike: number;
  probability: number;
  rain: number;
  wind: number;
  gusts: number;
}

interface SeriesDef {
  key: keyof Row;
  /** Names the series in `place.hourly.series`. */
  label: "temperature" | "feelsLike" | "chanceOfRain" | "wind" | "gusts";
  color: string;
  dashed?: boolean;
}

// Colours are assigned by entity (see the note in globals.css), never by position.
const SERIES: Record<Metric, SeriesDef[]> = {
  temperature: [
    { key: "temperature", label: "temperature", color: "var(--chart-1)" },
    { key: "feelsLike", label: "feelsLike", color: "var(--chart-2)", dashed: true },
  ],
  rain: [{ key: "probability", label: "chanceOfRain", color: "var(--chart-3)" }],
  wind: [
    { key: "wind", label: "wind", color: "var(--chart-4)" },
    { key: "gusts", label: "gusts", color: "var(--chart-5)", dashed: true },
  ],
};

const METRICS: Metric[] = ["temperature", "rain", "wind"];

const HEIGHT = "h-64 w-full aspect-auto";

/** Consecutive night hours as [from, to] pairs, drawn as faint bands behind the series. */
function nightBands(rows: Row[]) {
  const bands: Array<[string, string]> = [];
  let start: string | null = null;
  rows.forEach((row, i) => {
    if (!row.isDay && start === null) start = row.time;
    if (start !== null && (row.isDay || i === rows.length - 1)) {
      bands.push([start, row.isDay ? rows[i - 1].time : row.time]);
      start = null;
    }
  });
  return bands;
}

export function HourlyChart({ hours, units }: { hours: HourlyPoint[]; units: Units }) {
  const locale = useLocale();
  const t = useMessages();
  const text = t.place.hourly;
  const [metric, setMetric] = useState<Metric>("temperature");
  const labels = unitLabels(units);

  const rows: Row[] = useMemo(
    () =>
      hours.map((hour) => ({
        time: hour.time,
        isDay: hour.isDay,
        temperature: round1(convertTemperature(hour.temperature, units)),
        feelsLike: round1(convertTemperature(hour.apparentTemperature, units)),
        probability: hour.precipitationProbability,
        rain: convertPrecipitation(hour.precipitation, units),
        wind: round1(convertSpeed(hour.windSpeed, units)),
        gusts: round1(convertSpeed(hour.windGusts, units)),
      })),
    [hours, units],
  );

  const series = SERIES[metric];
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: text.series[s.label], color: s.color }]),
  ) satisfies ChartConfig;
  const unit =
    metric === "temperature" ? labels.temperature : metric === "rain" ? "%" : labels.speed;

  const shared = {
    data: rows,
    margin: { top: 16, right: 8, bottom: 0, left: 0 },
    accessibilityLayer: true,
  };

  const decorations = [
    ...nightBands(rows).map(([x1, x2]) => (
      <ReferenceArea
        key={`night-${x1}`}
        x1={x1}
        x2={x2}
        fill="var(--foreground)"
        fillOpacity={0.05}
        ifOverflow="visible"
      />
    )),
    ...rows
      .filter((row, i) => i > 0 && row.time.endsWith("T00:00"))
      .map((row) => (
        <ReferenceLine
          key={`day-${row.time}`}
          x={row.time}
          stroke="var(--border)"
          label={{
            value: formatWeekday(row.time, "short", locale),
            position: "insideTopLeft",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
      )),
  ];

  const axes = [
    <CartesianGrid key="grid" vertical={false} stroke="var(--border)" />,
    <XAxis
      key="x"
      dataKey="time"
      tickFormatter={(iso: string) => formatHour(iso, locale)}
      interval={5}
      tickLine={false}
      axisLine={{ stroke: "var(--border)" }}
      tickMargin={8}
    />,
    <YAxis
      key="y"
      width={40}
      tickLine={false}
      axisLine={false}
      allowDecimals={false}
      tickFormatter={(value: number) =>
        metric === "temperature" ? `${value}°` : metric === "rain" ? `${value}%` : `${value}`
      }
      domain={
        metric === "rain"
          ? [0, 100]
          : metric === "temperature"
            ? [(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]
            : [0, (max: number) => Math.ceil(max / 5) * 5 || 5]
      }
    />,
    <ChartTooltip
      key="tooltip"
      cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
      content={<HourTooltip metric={metric} series={series} unit={unit} units={units} />}
    />,
  ];

  const first = rows[0];
  const last = rows[rows.length - 1];
  const summary = text.summary(
    text.metrics[metric],
    rows.length,
    `${formatWeekday(first.time, "short", locale)} ${formatHour(first.time, locale)}`,
    `${formatWeekday(last.time, "short", locale)} ${formatHour(last.time, locale)}`,
  );

  return (
    <div className="fit:flex fit:flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 fit:mb-2">
        <ToggleGroup
          type="single"
          value={metric}
          // A single-select group reports "" when the active item is clicked again; ignore that.
          onValueChange={(value) => value && setMetric(value as Metric)}
          variant="outline"
          size="sm"
          aria-label={text.chartMetric}
        >
          {METRICS.map((key) => (
            <ToggleGroupItem key={key} value={key}>
              {text.metrics[key]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {series.length > 1 && (
          <ul className="flex gap-3 text-xs text-muted-foreground" aria-label={text.legend}>
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-5 border-t-2"
                  style={{ borderColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }}
                />
                {text.series[s.label]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div role="group" aria-label={summary} className="">
        {metric === "temperature" && (
          <ChartContainer config={config} className={HEIGHT}>
            <AreaChart {...shared}>
              {axes}
              {decorations}
              <Area
                dataKey="temperature"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              />
              <Area
                dataKey="feelsLike"
                type="monotone"
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="none"
                dot={false}
                activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}

        {metric === "rain" && (
          <ChartContainer config={config} className={HEIGHT}>
            <BarChart {...shared}>
              {axes}
              {decorations}
              <Bar
                dataKey="probability"
                fill="var(--chart-3)"
                maxBarSize={14}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}

        {metric === "wind" && (
          <ChartContainer config={config} className={HEIGHT}>
            <LineChart {...shared}>
              {axes}
              {decorations}
              <Line
                dataKey="wind"
                type="monotone"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              />
              <Line
                dataKey="gusts"
                type="monotone"
                stroke="var(--chart-5)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground fit:hidden">
        {[text.nightNote, metric === "rain" && text.barsNote].filter(Boolean).join(". ")}.
      </p>
    </div>
  );
}

const round1 = (value: number) => Math.round(value * 10) / 10;

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: Row }>;
  metric: Metric;
  series: SeriesDef[];
  unit: string;
  units: Units;
}

/** Values lead, labels follow; each row is keyed by a short stroke of its series colour. */
function HourTooltip({ active, payload, metric, series, unit, units }: TooltipProps) {
  const locale = useLocale();
  const text = useMessages().place.hourly;
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const format = (key: keyof Row) => {
    const value = row[key] as number;
    return key === "temperature" || key === "feelsLike"
      ? `${Math.round(value)}°`
      : `${Math.round(value)} ${unit}`;
  };

  return (
    <div className="min-w-36 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-popover-foreground">
        {formatWeekday(row.time, "short", locale)} {formatHour(row.time, locale)}
      </p>
      <ul className="space-y-1">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3 border-t-2"
              style={{ borderColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }}
            />
            <span className="text-sm font-semibold text-popover-foreground">{format(s.key)}</span>
            <span className="text-muted-foreground">{text.series[s.label]}</span>
          </li>
        ))}
        {metric === "rain" && (
          <li className="pl-5 text-muted-foreground">
            {text.expected(
              row.rain.toFixed(units === "imperial" ? 2 : 1),
              unitLabels(units).precipitation,
            )}
          </li>
        )}
      </ul>
    </div>
  );
}
