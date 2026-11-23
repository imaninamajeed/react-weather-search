import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";

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

type Entry = { day: WeatherIconName; night?: WeatherIconName };

// WMO weather interpretation codes as used by Open-Meteo.
const CODES: Record<number, Entry> = {
  0: { day: "clear-day", night: "clear-night" },
  1: { day: "clear-day", night: "clear-night" },
  2: { day: "partly-cloudy-day", night: "partly-cloudy-night" },
  3: { day: "cloudy" },
  45: { day: "fog" },
  48: { day: "fog" },
  51: { day: "drizzle" },
  53: { day: "drizzle" },
  55: { day: "drizzle" },
  56: { day: "freezing-rain" },
  57: { day: "freezing-rain" },
  61: { day: "rain" },
  63: { day: "rain" },
  65: { day: "rain" },
  66: { day: "freezing-rain" },
  67: { day: "freezing-rain" },
  71: { day: "snow" },
  73: { day: "snow" },
  75: { day: "snow" },
  77: { day: "snow" },
  80: { day: "rain" },
  81: { day: "rain" },
  82: { day: "rain" },
  85: { day: "snow" },
  86: { day: "snow" },
  95: { day: "thunderstorm" },
  96: { day: "hail" },
  99: { day: "hail" },
};

export function describeWeather(
  code: number,
  isDay = true,
  locale: Locale = DEFAULT_LOCALE,
): WeatherDescription {
  const { weather } = getMessages(locale);
  const entry = CODES[code];
  if (!entry) return { label: weather.unknownConditions, icon: "cloudy" };
  return { label: weather.codes[code], icon: isDay ? entry.day : (entry.night ?? entry.day) };
}

export function isThunderstorm(code: number): boolean {
  return code === 95 || code === 96 || code === 99;
}

/** Any liquid or frozen precipitation (drizzle, rain, snow, showers, storms). */
export function isPrecipitation(code: number): boolean {
  return code >= 51 && code !== 45 && code !== 48;
}
