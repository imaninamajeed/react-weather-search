import { IconCloud, IconDroplet, IconEye, IconGauge, IconSun } from "@tabler/icons-react";
import { Suspense, type ReactNode } from "react";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { TileSkeleton } from "@/components/shared/skeletons";
import { formatHourRange } from "@/lib/format";
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

function describeVisibility(metres: number) {
  if (metres >= 10_000) return "Clear";
  if (metres >= 4_000) return "Slightly hazy";
  if (metres >= 1_000) return "Hazy";
  return "Poor";
}

function describeCloudCover(percent: number) {
  if (percent < 20) return "Clear skies";
  if (percent < 50) return "Mostly clear";
  if (percent < 80) return "Mostly cloudy";
  return "Overcast";
}

export function ConditionsGrid({ forecast, units }: { forecast: Forecast; units: Units }) {
  const { current, hourly } = forecast;
  const uv = uvCategory(current.uvIndex);
  const protection = uvProtectionWindow(hourly, current.time);
  const labels = unitLabels(units);

  const tiles: ReactNode[] = [
    <Tile
      key="humidity"
      label="Humidity"
      icon={IconDroplet}
      accent="var(--brand-indigo)"
      value={Math.round(current.humidity)}
      unit="%"
      caption={`Dew point ${formatTemperature(current.dewPoint, units)}`}
    />,
    <Tile
      key="uv"
      label="UV index"
      icon={IconSun}
      accent="var(--brand-violet)"
      value={Math.round(current.uvIndex)}
      unit={uv.label}
      caption={
        protection
          ? `Sun protection ${formatHourRange(protection.first, protection.last)}`
          : "No sun protection needed for the rest of today"
      }
    >
      <Meter
        value={current.uvIndex}
        max={11}
        tone={UV_TONES[uv.level]}
        label={`UV index ${uv.label}`}
      />
    </Tile>,
    <div key="air-quality" className="contents">
      <SectionBoundary title="Air quality">
        <Suspense fallback={<TileSkeleton />}>
          <AirQualityTile latitude={forecast.latitude} longitude={forecast.longitude} />
        </Suspense>
      </SectionBoundary>
    </div>,
    <Tile
      key="pressure"
      label="Pressure"
      icon={IconGauge}
      accent="var(--brand-magenta)"
      value={
        units === "imperial"
          ? convertPressure(current.pressure, units).toFixed(2)
          : Math.round(current.pressure)
      }
      unit={labels.pressure}
      caption="At sea level"
    />,
    <Tile
      key="visibility"
      label="Visibility"
      icon={IconEye}
      accent="var(--brand-teal-text)"
      value={Number(convertDistance(current.visibility, units).toFixed(1))}
      unit={labels.distance}
      caption={`${describeVisibility(current.visibility)} · ${formatDistance(current.visibility, units)}`}
    />,
    <Tile
      key="cloud"
      label="Cloud cover"
      icon={IconCloud}
      accent="var(--brand-indigo)"
      value={Math.round(current.cloudCover)}
      unit="%"
      caption={describeCloudCover(current.cloudCover)}
    />,
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <SunArc forecast={forecast} className="sm:col-span-2" />
      <WindCompass forecast={forecast} units={units} />
      {tiles}
    </div>
  );
}
