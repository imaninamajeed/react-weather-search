import { IconCloud, IconDroplet, IconEye, IconGauge, IconSun } from "@tabler/icons-react";
import { Suspense, type ReactNode } from "react";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { TileSkeleton } from "@/components/shared/skeletons";
import { formatHourRange } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/messages";
import {
  convertDistance,
  convertPressure,
  formatDistance,
  formatTemperature,
  unitLabels,
} from "@/lib/units";
import type { Forecast, Units } from "@/lib/weather/types";
import { uvCategory, uvProtectionWindow } from "@/lib/weather/uv";
import { AirQualityTile } from "./air-quality";
import { SunArc } from "./sun-arc";
import { Meter, Tile, type MeterTone } from "./tile";
import { WindCompass } from "./wind-compass";

const UV_TONES: MeterTone[] = ["good", "good", "advisory", "warning", "warning"];

function describeVisibility(metres: number, t: Messages) {
  const levels = t.place.conditions.visibilityLevels;
  if (metres >= 10_000) return levels.clear;
  if (metres >= 4_000) return levels.slightlyHazy;
  if (metres >= 1_000) return levels.hazy;
  return levels.poor;
}

function describeCloudCover(percent: number, t: Messages) {
  const levels = t.place.conditions.cloudLevels;
  if (percent < 20) return levels.clearSkies;
  if (percent < 50) return levels.mostlyClear;
  if (percent < 80) return levels.mostlyCloudy;
  return levels.overcast;
}

export async function ConditionsGrid({ forecast, units }: { forecast: Forecast; units: Units }) {
  const { locale, t } = await getI18n();
  const text = t.place.conditions;
  const { current, hourly } = forecast;
  const uv = uvCategory(current.uvIndex, locale);
  const protection = uvProtectionWindow(hourly, current.time);
  const labels = unitLabels(units);

  const tiles: ReactNode[] = [
    <Tile
      key="humidity"
      label={text.humidity}
      icon={IconDroplet}
      accent="var(--brand-indigo)"
      value={Math.round(current.humidity)}
      unit="%"
      caption={text.dewPoint(formatTemperature(current.dewPoint, units))}
    />,
    <Tile
      key="uv"
      label={text.uvIndex}
      icon={IconSun}
      accent="var(--brand-violet)"
      value={Math.round(current.uvIndex)}
      unit={uv.label}
      caption={
        protection
          ? text.sunProtection(formatHourRange(protection.first, protection.last, locale))
          : text.noSunProtection
      }
    >
      <Meter
        value={current.uvIndex}
        max={11}
        tone={UV_TONES[uv.level]}
        label={text.uvMeter(uv.label)}
      />
    </Tile>,
    <div key="air-quality" className="contents">
      <SectionBoundary title={t.place.view.airQuality}>
        <Suspense fallback={<TileSkeleton />}>
          <AirQualityTile latitude={forecast.latitude} longitude={forecast.longitude} />
        </Suspense>
      </SectionBoundary>
    </div>,
    <Tile
      key="pressure"
      label={text.pressure}
      icon={IconGauge}
      accent="var(--brand-magenta)"
      value={
        units === "imperial"
          ? convertPressure(current.pressure, units).toFixed(2)
          : Math.round(current.pressure)
      }
      unit={labels.pressure}
      caption={text.atSeaLevel}
    />,
    <Tile
      key="visibility"
      label={text.visibility}
      icon={IconEye}
      accent="var(--brand-teal-text)"
      value={Number(convertDistance(current.visibility, units).toFixed(1))}
      unit={labels.distance}
      caption={`${describeVisibility(current.visibility, t)} · ${formatDistance(current.visibility, units)}`}
    />,
    <Tile
      key="cloud"
      label={text.cloudCover}
      icon={IconCloud}
      accent="var(--brand-indigo)"
      value={Math.round(current.cloudCover)}
      unit="%"
      caption={describeCloudCover(current.cloudCover, t)}
    />,
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 fit:grid-cols-5 fit:grid-rows-2">
      <SunArc forecast={forecast} className="sm:col-span-2 fit:col-span-1 fit:row-span-2" />
      <WindCompass forecast={forecast} units={units} className="fit:row-span-2" />
      {tiles}
    </div>
  );
}
