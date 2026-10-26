import { getAirQuality } from "@/lib/open-meteo/air-quality";
import { aqiCategory } from "@/lib/weather/aqi";
import { Meter, Tile, type MeterTone } from "./tile";

const AQI_TONES: MeterTone[] = ["good", "advisory", "advisory", "warning", "warning", "warning"];

/** Fetched on its own: this upstream is the slowest, so it streams in behind a skeleton. */
export async function AirQualityTile({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const airQuality = await getAirQuality(latitude, longitude);

  if (!airQuality) {
    return <Tile label="Air quality" value="—" caption="No air-quality data for this location." />;
  }

  const category = aqiCategory(airQuality.usAqi);
  const pm25 = airQuality.pm25 === null ? null : Math.round(airQuality.pm25);

  return (
    <Tile
      label="Air quality (US AQI)"
      value={Math.round(airQuality.usAqi)}
      unit={category.label}
      caption={pm25 === null ? category.advice : `${category.advice} PM2.5 ${pm25} µg/m³.`}
    >
      <Meter
        value={airQuality.usAqi}
        max={300}
        tone={AQI_TONES[category.level]}
        label={`Air quality ${category.label}`}
      />
    </Tile>
  );
}
