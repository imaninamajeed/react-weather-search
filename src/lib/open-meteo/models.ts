import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { roundCoordinate } from "@/lib/places";
import { MODELS, type ModelDay, type ModelId, type ModelValues } from "@/lib/weather/confidence";
import { fetchJson, openMeteoUrl } from "./client";

const DAYS = 7;

// With several models the response keys are suffixed, e.g. "temperature_2m_max_gfs_seamless".
// The key set depends on which models answered, so `daily` is a record of series.
const modelsResponseSchema = z.object({
  daily: z.record(z.string(), z.array(z.union([z.string(), z.number()]).nullable())),
});

export type ModelsResponse = z.infer<typeof modelsResponseSchema>;

export function normalizeModelDays(raw: ModelsResponse): ModelDay[] {
  const { daily } = raw;
  const pick = (variable: string, index: number): ModelValues => {
    const values: ModelValues = {};
    for (const { id } of MODELS) {
      const value = daily[`${variable}_${id}`]?.[index];
      if (typeof value === "number") values[id as ModelId] = value;
    }
    return values;
  };

  const dates = (daily.time ?? []).filter((date): date is string => typeof date === "string");
  return dates.map((date, index) => ({
    date,
    temperatureMax: pick("temperature_2m_max", index),
    precipitation: pick("precipitation_sum", index),
  }));
}

async function fetchModelDays(latitude: number, longitude: number): Promise<ModelDay[]> {
  "use cache";
  cacheLife("hours");

  const url = openMeteoUrl("forecast", "/v1/forecast", {
    latitude,
    longitude,
    timezone: "auto",
    daily: "temperature_2m_max,precipitation_sum",
    models: MODELS.map((model) => model.id).join(","),
    forecast_days: DAYS,
    temperature_unit: "celsius",
    precipitation_unit: "mm",
  });
  return normalizeModelDays(
    await fetchJson(url, modelsResponseSchema, { source: "open-meteo/models" }),
  );
}

/** The next week's daily high and rainfall as predicted by three independent weather models. */
export function getModelDays(latitude: number, longitude: number): Promise<ModelDay[]> {
  return fetchModelDays(roundCoordinate(latitude), roundCoordinate(longitude));
}
