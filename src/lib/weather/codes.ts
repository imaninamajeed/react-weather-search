/** Icon identifiers; components/shared/weather-icon.tsx maps these to lucide icons. */
export type WeatherIconName =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing-rain"
  | "snow"
  | "thunderstorm"
  | "hail";

export interface WeatherDescription {
  label: string;
  icon: WeatherIconName;
}

type Entry = { label: string; day: WeatherIconName; night?: WeatherIconName };

// WMO weather interpretation codes as used by Open-Meteo.
const CODES: Record<number, Entry> = {
  0: { label: "Clear sky", day: "clear-day", night: "clear-night" },
  1: { label: "Mainly clear", day: "clear-day", night: "clear-night" },
  2: { label: "Partly cloudy", day: "partly-cloudy-day", night: "partly-cloudy-night" },
  3: { label: "Overcast", day: "cloudy" },
  45: { label: "Fog", day: "fog" },
  48: { label: "Freezing fog", day: "fog" },
  51: { label: "Light drizzle", day: "drizzle" },
  53: { label: "Drizzle", day: "drizzle" },
  55: { label: "Heavy drizzle", day: "drizzle" },
  56: { label: "Light freezing drizzle", day: "freezing-rain" },
  57: { label: "Freezing drizzle", day: "freezing-rain" },
  61: { label: "Light rain", day: "rain" },
  63: { label: "Rain", day: "rain" },
  65: { label: "Heavy rain", day: "rain" },
  66: { label: "Light freezing rain", day: "freezing-rain" },
  67: { label: "Freezing rain", day: "freezing-rain" },
  71: { label: "Light snow", day: "snow" },
  73: { label: "Snow", day: "snow" },
  75: { label: "Heavy snow", day: "snow" },
  77: { label: "Snow grains", day: "snow" },
  80: { label: "Light showers", day: "rain" },
  81: { label: "Showers", day: "rain" },
  82: { label: "Violent showers", day: "rain" },
  85: { label: "Light snow showers", day: "snow" },
  86: { label: "Heavy snow showers", day: "snow" },
  95: { label: "Thunderstorm", day: "thunderstorm" },
  96: { label: "Thunderstorm with hail", day: "hail" },
  99: { label: "Severe thunderstorm with hail", day: "hail" },
};

export function describeWeather(code: number, isDay = true): WeatherDescription {
  const entry = CODES[code];
  if (!entry) return { label: "Unknown conditions", icon: "cloudy" };
  return { label: entry.label, icon: isDay ? entry.day : (entry.night ?? entry.day) };
}

export function isThunderstorm(code: number): boolean {
  return code === 95 || code === 96 || code === 99;
}

/** Any liquid or frozen precipitation (drizzle, rain, snow, showers, storms). */
export function isPrecipitation(code: number): boolean {
  return code >= 51 && code !== 45 && code !== 48;
}
