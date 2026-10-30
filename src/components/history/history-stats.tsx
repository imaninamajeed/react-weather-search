import { Tile } from "@/components/place/tile";
import { formatDayMonth } from "@/lib/format";
import { formatPrecipitation, formatTemperature, formatTemperatureDelta } from "@/lib/units";
import type { HistorySummary } from "@/lib/weather/climate";
import type { Units } from "@/lib/weather/types";

/** The year at a glance, each number compared with what is normal for the place. */
export function HistoryStats({ summary, units }: { summary: HistorySummary; units: Units }) {
  const anomaly = summary.meanAnomaly;
  const inLine = Math.abs(anomaly) < 0.3;
  const rain = summary.rainPercentOfNormal;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 fit:grid-cols-6">
      <Tile
        label="Daily highs vs normal"
        value={inLine ? "On par" : formatTemperatureDelta(anomaly, units)}
        unit={inLine ? undefined : anomaly > 0 ? "warmer" : "cooler"}
        caption={`Average over ${summary.days} days against 1991–2020.`}
      />
      <Tile
        label="Rainfall"
        value={rain === null ? "—" : Math.round(rain)}
        unit={rain === null ? undefined : "% of normal"}
        caption={`${formatPrecipitation(summary.rainTotal, units)} fell; about ${formatPrecipitation(summary.rainNormal, units)} is typical for this period.`}
      />
      <Tile
        label="Unusually hot days"
        value={summary.daysAboveNormalRange}
        unit="days"
        caption={`Hotter than 9 in 10 normal days. About ${summary.expectedOutside} would be expected.`}
      />
      <Tile
        label="Unusually cool days"
        value={summary.daysBelowNormalRange}
        unit="days"
        caption={`Cooler than 9 in 10 normal days. About ${summary.expectedOutside} would be expected.`}
      />
      <Tile
        label="Warmest day"
        value={summary.warmest ? formatTemperature(summary.warmest.value, units) : "—"}
        caption={summary.warmest ? formatDayMonth(summary.warmest.date) : undefined}
      />
      <Tile
        label="Wettest day"
        value={summary.wettest ? formatPrecipitation(summary.wettest.value, units) : "—"}
        caption={summary.wettest ? formatDayMonth(summary.wettest.date) : undefined}
      />
    </div>
  );
}
