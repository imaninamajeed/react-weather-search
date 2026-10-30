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
  0: { label: "Clear Sky", day: "clear-day", night: "clear-night" },
  1: { label: "Mainly Clear", day: "clear-day", night: "clear-night" },
  2: { label: "Partly Cloudy", day: "partly-cloudy-day", night: "partly-cloudy-night" },
  3: { label: "Overcast", day: "cloudy" },
  45: { label: "Fog", day: "fog" },
  48: { label: "Freezing Fog", day: "fog" },
  51: { label: "Light Drizzle", day: "drizzle" },
  53: { label: "Drizzle", day: "drizzle" },
  55: { label: "Heavy Drizzle", day: "drizzle" },
  56: { label: "Light Freezing Drizzle", day: "freezing-rain" },
  57: { label: "Freezing Drizzle", day: "freezing-rain" },
  61: { label: "Light Rain", day: "rain" },
  63: { label: "Rain", day: "rain" },
  65: { label: "Heavy Rain", day: "rain" },
  66: { label: "Light Freezing Rain", day: "freezing-rain" },
  67: { label: "Freezing Rain", day: "freezing-rain" },
  71: { label: "Light Snow", day: "snow" },
  73: { label: "Snow", day: "snow" },
  75: { label: "Heavy Snow", day: "snow" },
  77: { label: "Snow Grains", day: "snow" },
  80: { label: "Light Showers", day: "rain" },
  81: { label: "Showers", day: "rain" },
  82: { label: "Violent Showers", day: "rain" },
  85: { label: "Light Snow Showers", day: "snow" },
  86: { label: "Heavy Snow Showers", day: "snow" },
  95: { label: "Thunderstorm", day: "thunderstorm" },
  96: { label: "Thunderstorm with Hail", day: "hail" },
  99: { label: "Severe Thunderstorm with Hail", day: "hail" },
};

export function describeWeather(code: number, isDay = true): WeatherDescription {
  const entry = CODES[code];
  if (!entry) return { label: "Unknown Conditions", icon: "cloudy" };
  return { label: entry.label, icon: isDay ? entry.day : (entry.night ?? entry.day) };
}

export function isThunderstorm(code: number): boolean {
  return code === 95 || code === 96 || code === 99;
}

/** Any liquid or frozen precipitation (drizzle, rain, snow, showers, storms). */
export function isPrecipitation(code: number): boolean {
  return code >= 51 && code !== 45 && code !== 48;
}
