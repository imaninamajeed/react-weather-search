/**
 * Domain types. Everything is stored in metric (°C, km/h, mm, hPa, m) and only
 * converted at render time (see lib/units.ts).
 *
 * Times are *naive local* ISO strings in the place's own timezone, exactly as the
 * upstream returns them ("2026-10-27T14:00", dates as "2026-10-27"). They are
 * formatted without ever passing through the viewer's timezone (see lib/format.ts).
 */

export type Units = "metric" | "imperial";

export interface CurrentConditions {
  time: string;
  isDay: boolean;
  weatherCode: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  dewPoint: number;
  precipitation: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  /** Metres. */
  visibility: number;
  uvIndex: number;
}

export interface HourlyPoint {
  time: string;
  isDay: boolean;
  weatherCode: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  /** 0–100. */
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  uvIndex: number;
}

export interface DailyPoint {
  /** "YYYY-MM-DD" in the place's timezone. */
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  precipitationSum: number;
  /** 0–100. */
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  uvIndexMax: number;
  /** Centimetres. */
  snowfallSum: number;
  sunrise: string;
  sunset: string;
  daylightSeconds: number;
}

export interface Forecast {
  timezone: string;
  utcOffsetSeconds: number;
  latitude: number;
  longitude: number;
  elevation: number;
  current: CurrentConditions;
  /** The next 72 hours, starting at the current hour. */
  hourly: HourlyPoint[];
  /** Today plus the next 13 days. */
  daily: DailyPoint[];
}

export interface AirQuality {
  time: string;
  /** US AQI (0–500). */
  usAqi: number;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogenDioxide: number | null;
}
