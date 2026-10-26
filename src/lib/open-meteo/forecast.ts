import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { roundCoordinate } from "@/lib/places";
import type { CurrentConditions, DailyPoint, Forecast, HourlyPoint } from "@/lib/weather/types";
import { fetchJson, openMeteoUrl, UpstreamError } from "./client";

const FORECAST_DAYS = 14;
const FORECAST_HOURS = 72;

// Open-Meteo returns `null` for values a model doesn't provide.
const num = z.number().nullable();
const nums = z.array(num);

// The request's field lists are derived from these shapes, so the schema is the
// single source of truth for what we ask for and what we validate.
const currentSchema = z.object({
  time: z.string(),
  temperature_2m: num,
  apparent_temperature: num,
  relative_humidity_2m: num,
  dew_point_2m: num,
  is_day: num,
  precipitation: num,
  weather_code: num,
  cloud_cover: num,
  pressure_msl: num,
  wind_speed_10m: num,
  wind_direction_10m: num,
  wind_gusts_10m: num,
  visibility: num,
  uv_index: num,
});

const hourlySchema = z.object({
  time: z.array(z.string()),
  temperature_2m: nums,
  apparent_temperature: nums,
  relative_humidity_2m: nums,
  precipitation_probability: nums,
  precipitation: nums,
  weather_code: nums,
  wind_speed_10m: nums,
  wind_gusts_10m: nums,
  is_day: nums,
  uv_index: nums,
});

const dailySchema = z.object({
  time: z.array(z.string()),
  weather_code: nums,
  temperature_2m_max: nums,
  temperature_2m_min: nums,
  apparent_temperature_max: nums,
  precipitation_sum: nums,
  precipitation_probability_max: nums,
  wind_speed_10m_max: nums,
  wind_gusts_10m_max: nums,
  uv_index_max: nums,
  snowfall_sum: nums,
  sunrise: z.array(z.string().nullable()),
  sunset: z.array(z.string().nullable()),
  daylight_duration: nums,
});

export const forecastResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().default(0),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  current: currentSchema,
  hourly: hourlySchema,
  daily: dailySchema,
});

export type ForecastResponse = z.infer<typeof forecastResponseSchema>;

const fields = (shape: Record<string, unknown>) =>
  Object.keys(shape)
    .filter((key) => key !== "time")
    .join(",");

/** A missing essential measurement makes the whole response unusable. */
function required(value: number | null | undefined, field: string): number {
  if (typeof value !== "number") {
    throw new UpstreamError(`Forecast is missing ${field}`, "open-meteo/forecast");
  }
  return value;
}

/** Non-essential measurements degrade to 0 rather than failing the page. */
const orZero = (value: number | null | undefined) => value ?? 0;

export function normalizeForecast(raw: ForecastResponse): Forecast {
  const c = raw.current;
  const current: CurrentConditions = {
    time: c.time,
    isDay: c.is_day === 1,
    weatherCode: required(c.weather_code, "current.weather_code"),
    temperature: required(c.temperature_2m, "current.temperature_2m"),
    apparentTemperature: required(c.apparent_temperature, "current.apparent_temperature"),
    humidity: orZero(c.relative_humidity_2m),
    dewPoint: orZero(c.dew_point_2m),
    precipitation: orZero(c.precipitation),
    cloudCover: orZero(c.cloud_cover),
    pressure: orZero(c.pressure_msl),
    windSpeed: orZero(c.wind_speed_10m),
    windDirection: orZero(c.wind_direction_10m),
    windGusts: orZero(c.wind_gusts_10m),
    visibility: orZero(c.visibility),
    uvIndex: orZero(c.uv_index),
  };

  const h = raw.hourly;
  const hourly: HourlyPoint[] = h.time.map((time, i) => ({
    time,
    isDay: h.is_day[i] === 1,
    weatherCode: orZero(h.weather_code[i]),
    temperature: required(h.temperature_2m[i], `hourly.temperature_2m[${i}]`),
    apparentTemperature: orZero(h.apparent_temperature[i]),
    humidity: orZero(h.relative_humidity_2m[i]),
    precipitationProbability: orZero(h.precipitation_probability[i]),
    precipitation: orZero(h.precipitation[i]),
    windSpeed: orZero(h.wind_speed_10m[i]),
    windGusts: orZero(h.wind_gusts_10m[i]),
    uvIndex: orZero(h.uv_index[i]),
  }));

  const d = raw.daily;
  const daily: DailyPoint[] = d.time.map((date, i) => ({
    date,
    weatherCode: orZero(d.weather_code[i]),
    temperatureMax: required(d.temperature_2m_max[i], `daily.temperature_2m_max[${i}]`),
    temperatureMin: required(d.temperature_2m_min[i], `daily.temperature_2m_min[${i}]`),
    apparentTemperatureMax: orZero(d.apparent_temperature_max[i]),
    precipitationSum: orZero(d.precipitation_sum[i]),
    precipitationProbabilityMax: orZero(d.precipitation_probability_max[i]),
    windSpeedMax: orZero(d.wind_speed_10m_max[i]),
    windGustsMax: orZero(d.wind_gusts_10m_max[i]),
    uvIndexMax: orZero(d.uv_index_max[i]),
    snowfallSum: orZero(d.snowfall_sum[i]),
    // Polar day/night has no sunrise or sunset; fall back to midnight of that date.
    sunrise: d.sunrise[i] ?? `${date}T00:00`,
    sunset: d.sunset[i] ?? `${date}T00:00`,
    daylightSeconds: orZero(d.daylight_duration[i]),
  }));

  return {
    timezone: raw.timezone,
    utcOffsetSeconds: raw.utc_offset_seconds,
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation,
    current,
    hourly,
    daily,
  };
}

async function fetchForecast(latitude: number, longitude: number): Promise<Forecast> {
  "use cache";
  cacheLife("forecast");

  const url = openMeteoUrl("forecast", "/v1/forecast", {
    latitude,
    longitude,
    timezone: "auto",
    current: fields(currentSchema.shape),
    hourly: fields(hourlySchema.shape),
    daily: fields(dailySchema.shape),
    forecast_days: FORECAST_DAYS,
    forecast_hours: FORECAST_HOURS,
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  const raw = await fetchJson(url, forecastResponseSchema, { source: "open-meteo/forecast" });
  return normalizeForecast(raw);
}

/** Current conditions, 72 hourly points and 14 daily points. Coordinates are snapped to ~1 km. */
export function getForecast(latitude: number, longitude: number): Promise<Forecast> {
  return fetchForecast(roundCoordinate(latitude), roundCoordinate(longitude));
}
