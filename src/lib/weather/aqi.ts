import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";

export interface AqiCategory {
  label: string;
  /** Short advice shown under the number. */
  advice: string;
  /** 0 = good … 5 = hazardous; drives colour. */
  level: 0 | 1 | 2 | 3 | 4 | 5;
}

/** US EPA AQI breakpoints. */
export function aqiCategory(aqi: number, locale: Locale = DEFAULT_LOCALE): AqiCategory {
  const { aqi: text } = getMessages(locale).weather;
  if (aqi <= 50) return { ...text.good, level: 0 };
  if (aqi <= 100) return { ...text.moderate, level: 1 };
  if (aqi <= 150) return { ...text.sensitive, level: 2 };
  if (aqi <= 200) return { ...text.unhealthy, level: 3 };
  if (aqi <= 300) return { ...text.veryUnhealthy, level: 4 };
  return { ...text.hazardous, level: 5 };
}
