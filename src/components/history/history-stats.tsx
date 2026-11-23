import { Tile } from "@/components/place/tile";
import { formatDayMonth } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { formatPrecipitation, formatTemperature, formatTemperatureDelta } from "@/lib/units";
import type { HistorySummary } from "@/lib/weather/climate";
import type { Units } from "@/lib/weather/types";

/** The year at a glance, each number compared with what is normal for the place. */
export async function HistoryStats({ summary, units }: { summary: HistorySummary; units: Units }) {
  const { locale, t } = await getI18n();
  const text = t.place.history.stats;
  const anomaly = summary.meanAnomaly;
  const inLine = Math.abs(anomaly) < 0.3;
  const rain = summary.rainPercentOfNormal;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 fit:grid-cols-6">
      <Tile
        label={text.highsVsNormal}
        value={inLine ? text.onPar : formatTemperatureDelta(anomaly, units)}
        unit={inLine ? undefined : anomaly > 0 ? text.warmer : text.cooler}
        caption={text.average(summary.days)}
      />
      <Tile
        label={text.rainfall}
        value={rain === null ? "—" : Math.round(rain)}
        unit={rain === null ? undefined : text.percentOfNormal}
        caption={text.rainCaption(
          formatPrecipitation(summary.rainTotal, units),
          formatPrecipitation(summary.rainNormal, units),
        )}
      />
      <Tile
        label={text.hotDays}
        value={summary.daysAboveNormalRange}
        unit={text.days}
        caption={text.hotCaption(summary.expectedOutside)}
      />
      <Tile
        label={text.coolDays}
        value={summary.daysBelowNormalRange}
        unit={text.days}
        caption={text.coolCaption(summary.expectedOutside)}
      />
      <Tile
        label={text.warmestDay}
        value={summary.warmest ? formatTemperature(summary.warmest.value, units) : "—"}
        caption={summary.warmest ? formatDayMonth(summary.warmest.date, locale) : undefined}
      />
      <Tile
        label={text.wettestDay}
        value={summary.wettest ? formatPrecipitation(summary.wettest.value, units) : "—"}
        caption={summary.wettest ? formatDayMonth(summary.wettest.date, locale) : undefined}
      />
    </div>
  );
}
