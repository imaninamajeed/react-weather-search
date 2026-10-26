/** Parses and validates the lat/lon query of the point-weather endpoint. */
export function parseCoordinates(
  lat: string | null,
  lon: string | null,
): { latitude: number; longitude: number } | null {
  if (!lat || !lon || lat.length > 12 || lon.length > 12) return null;
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/** What the map popup shows about an arbitrary spot. Metric; the client formats it. */
export interface PointWeather {
  temperature: number;
  apparentTemperature: number;
  condition: string;
  windSpeed: number;
  windGusts: number;
  rainChance: number;
  localTime: string;
}
