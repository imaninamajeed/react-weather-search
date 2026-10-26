import { NextResponse, type NextRequest } from "next/server";
import { parseCoordinates, type PointWeather } from "@/lib/map/point";
import { UpstreamError } from "@/lib/open-meteo/client";
import { getForecast } from "@/lib/open-meteo/forecast";
import { describeWeather } from "@/lib/weather/codes";

/** Current conditions at an arbitrary point, for the map's click popup. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coordinates = parseCoordinates(searchParams.get("lat"), searchParams.get("lon"));
  if (!coordinates) return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });

  try {
    const { current, hourly } = await getForecast(coordinates.latitude, coordinates.longitude);
    const body: PointWeather = {
      temperature: current.temperature,
      apparentTemperature: current.apparentTemperature,
      condition: describeWeather(current.weatherCode, current.isDay).label,
      windSpeed: current.windSpeed,
      windGusts: current.windGusts,
      rainChance: hourly[0]?.precipitationProbability ?? 0,
      localTime: current.time,
    };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
    });
  } catch (error) {
    console.error("point weather failed", error instanceof UpstreamError ? error.message : error);
    return NextResponse.json({ error: "Weather is temporarily unavailable." }, { status: 502 });
  }
}
