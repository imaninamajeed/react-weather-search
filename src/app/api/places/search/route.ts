import { NextResponse, type NextRequest } from "next/server";
import { UpstreamError } from "@/lib/open-meteo/client";
import { searchPlaces } from "@/lib/open-meteo/geocoding";
import { MIN_QUERY_LENGTH, normalizeQuery } from "@/lib/open-meteo/geocoding-query";

/** Autocomplete endpoint for the search dialog. Results are cached per query upstream. */
export async function GET(request: NextRequest) {
  const query = normalizeQuery(request.nextUrl.searchParams.get("q") ?? "");
  if (query.length < MIN_QUERY_LENGTH) return NextResponse.json({ places: [] });

  try {
    const places = await searchPlaces(query);
    return NextResponse.json(
      { places },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("place search failed", error instanceof UpstreamError ? error.message : error);
    return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 502 });
  }
}
