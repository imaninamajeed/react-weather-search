"use client";

import { useMemo } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, ReferenceArea, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatHour, formatWeekday } from "@/lib/format";
import { convertTemperature, unitLabels } from "@/lib/units";
import type { HourlyPoint, Units } from "@/lib/weather/types";

const config = {
  temperature: { label: "Temperature", color: "var(--chart-1)" },
  probability: { label: "Chance of rain", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** Consecutive night hours as [from, to] pairs, drawn as faint bands behind the series. */
function nightBands(hours: HourlyPoint[]) {
  const bands: Array<[string, string]> = [];
  let start: string | null = null;
  hours.forEach((hour, i) => {
    if (!hour.isDay && start === null) start = hour.time;
    if (start !== null && (hour.isDay || i === hours.length - 1)) {
      bands.push([start, hour.isDay ? hours[i - 1].time : hour.time]);
      start = null;
    }
  });
  return bands;
}

/** Temperature as a filled curve with the chance of rain as bars beneath it. */
export function DayChart({ hours, units }: { hours: HourlyPoint[]; units: Units }) {
  const unit = unitLabels(units).temperature;
  const rows = useMemo(
    () =>
      hours.map((hour) => ({
        time: hour.time,
        temperature: Math.round(convertTemperature(hour.temperature, units) * 10) / 10,
        probability: hour.precipitationProbability,
      })),
    [hours, units],
  );
  const first = rows[0];
  const last = rows[rows.length - 1];
  const summary = `Temperature and chance of rain for the next ${rows.length} hours, ${formatWeekday(first.time)} ${formatHour(first.time)} to ${formatWeekday(last.time)} ${formatHour(last.time)}.`;

  return (
    <div role="group" aria-label={summary} className="fit:min-h-0 fit:flex-1">
      <ChartContainer config={config} className="aspect-auto h-72 w-full fit:h-full">
        <ComposedChart
          data={rows}
          margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id="day-temperature" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          {nightBands(hours).map(([x1, x2]) => (
            <ReferenceArea
              key={x1}
              yAxisId="temperature"
              x1={x1}
              x2={x2}
              fill="var(--foreground)"
              fillOpacity={0.05}
              ifOverflow="visible"
            />
          ))}
          <XAxis
            dataKey="time"
            tickFormatter={formatHour}
            interval={3}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            yAxisId="temperature"
            width={36}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={(value: number) => `${value}°`}
            domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
          />
          <YAxis yAxisId="rain" orientation="right" hide domain={[0, 100]} />
          <ChartTooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                labelFormatter={(value) =>
                  `${formatWeekday(String(value))} ${formatHour(String(value))}`
                }
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ background: item.color }}
                      />
                      {config[name as keyof typeof config].label}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {value}
                      {name === "probability" ? "%" : unit}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            yAxisId="rain"
            dataKey="probability"
            fill="var(--chart-3)"
            fillOpacity={0.4}
            radius={[6, 6, 0, 0]}
            maxBarSize={14}
          />
          <Area
            yAxisId="temperature"
            dataKey="temperature"
            type="monotone"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill="url(#day-temperature)"
            dot={false}
            activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
