import { IconLeaf } from "@tabler/icons-react";
import { getAirQuality } from "@/lib/open-meteo/air-quality";
import { getI18n } from "@/lib/i18n/server";
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
  const [airQuality, { locale, t }] = await Promise.all([
    getAirQuality(latitude, longitude),
    getI18n(),
  ]);
  const text = t.place.airQuality;

  if (!airQuality) {
    return (
      <Tile
        label={text.title}
        icon={IconLeaf}
        accent="var(--brand-teal-text)"
        value="—"
        caption={text.none}
      />
    );
  }

  const category = aqiCategory(airQuality.usAqi, locale);
  const pm25 = airQuality.pm25 === null ? null : Math.round(airQuality.pm25);

  return (
    <Tile
      label={text.title}
      icon={IconLeaf}
      accent="var(--brand-teal-text)"
      value={Math.round(airQuality.usAqi)}
      unit={category.label}
      caption={
        pm25 === null ? text.caption(category.advice) : text.captionWithPm(category.advice, pm25)
      }
    >
      <Meter
        value={airQuality.usAqi}
        max={300}
        tone={AQI_TONES[category.level]}
        label={text.meter(category.label)}
      />
    </Tile>
  );
}
