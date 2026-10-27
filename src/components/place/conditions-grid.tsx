import { IconArrowUp } from "@tabler/icons-react";
import { Suspense, type ReactNode } from "react";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { TileSkeleton } from "@/components/shared/skeletons";
import { formatDuration, formatHourRange, formatTime } from "@/lib/format";
import {
  compassPoint,
  convertDistance,
  convertPressure,
  convertSpeed,
  formatDistance,
  formatSpeed,
  formatTemperature,
  unitLabels,
} from "@/lib/units";
import type { Forecast, Units } from "@/lib/weather/types";
import { uvCategory, uvProtectionWindow } from "@/lib/weather/uv";
import { AirQualityTile } from "./air-quality";
import { Meter, Tile, type MeterTone } from "./tile";

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
  const { current, daily, hourly } = forecast;
  const today = daily[0];
  const uv = uvCategory(current.uvIndex);
  const protection = uvProtectionWindow(hourly, current.time);
  const labels = unitLabels(units);
  const windSpeed = Math.round(convertSpeed(current.windSpeed, units));

  const tiles: ReactNode[] = [
    <Tile
      key="wind"
      label="Wind"
      value={windSpeed}
      unit={labels.speed}
      caption={`Gusts ${formatSpeed(current.windGusts, units)} · from ${compassPoint(current.windDirection)}`}
    >
      <IconArrowUp
        aria-hidden="true"
        className="mt-3 size-5 text-muted-foreground"
        // The arrow points where the wind is blowing *to*, opposite of the compass "from" bearing.
        style={{ transform: `rotate(${(current.windDirection + 180) % 360}deg)` }}
      />
    </Tile>,
    <Tile
      key="humidity"
      label="Humidity"
      value={Math.round(current.humidity)}
      unit="%"
      caption={`Dew point ${formatTemperature(current.dewPoint, units)}`}
    />,
    <Tile
      key="uv"
      label="UV index"
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
      value={Number(convertDistance(current.visibility, units).toFixed(1))}
      unit={labels.distance}
      caption={`${describeVisibility(current.visibility)} · ${formatDistance(current.visibility, units)}`}
    />,
    <Tile
      key="sun"
      label="Daylight"
      value={formatDuration(today.daylightSeconds)}
      caption={`Sunrise ${formatTime(today.sunrise)} · Sunset ${formatTime(today.sunset)}`}
    />,
    <Tile
      key="cloud"
      label="Cloud cover"
      value={Math.round(current.cloudCover)}
      unit="%"
      caption={describeCloudCover(current.cloudCover)}
    />,
  ];

  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles}</div>;
}
