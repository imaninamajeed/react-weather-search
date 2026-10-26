// Preloaded into the Next.js *server* process for end-to-end tests (see playwright.config.ts):
//   NODE_OPTIONS="--import ./e2e/mock-upstream.mjs" next start
// It replaces global fetch so every upstream call (Open-Meteo, MET Malaysia, NWS, RainViewer)
// is answered from captured fixtures. Tests are therefore deterministic and offline, and the
// production code has no test hooks. Anything not mocked fails loudly instead of reaching the
// internet. Special coordinates trigger failures (see `FAIL_LATITUDE`).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fixture = (name) =>
  JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../src/test/fixtures/${name}.json`, import.meta.url)),
      "utf8",
    ),
  );

const realFetch = globalThis.fetch;
const json = (body, status = 200) => Response.json(body, { status });

/** A place at this latitude gets a failing air-quality upstream, to test per-section errors. */
const FAIL_LATITUDE = 12.34;
const TOKYO = { latitude: 35.69, timezone: "Asia/Tokyo", offset: 32400 };

const forecastFixture = fixture("forecast-subang-jaya");
const modelsFixture = fixture("models-subang-jaya");
const airQualityFixture = fixture("air-quality-subang-jaya");
const recentArchive = fixture("archive-recent-subang-jaya");
const geocodingTokyo = fixture("geocoding-tokyo");
const geocodingSubang = fixture("geocoding-subang-jaya");
const metFixture = fixture("met-malaysia-warnings");

const tokyoResult = geocodingTokyo.results[0];

function forecast(url) {
  const lat = Number(url.searchParams.get("latitude"));
  const lon = Number(url.searchParams.get("longitude"));
  const body = structuredClone(url.searchParams.has("models") ? modelsFixture : forecastFixture);
  body.latitude = lat;
  body.longitude = lon;
  if (Math.abs(lat - TOKYO.latitude) < 2) {
    body.timezone = TOKYO.timezone;
    body.utc_offset_seconds = TOKYO.offset;
  }
  return json(body);
}

/** 30 years of deterministic daily data for the climate normals. */
function normalsArchive() {
  const time = [];
  const tmax = [];
  const rain = [];
  for (
    let t = Date.parse("1991-01-01T00:00Z");
    t <= Date.parse("2020-12-31T00:00Z");
    t += 86_400_000
  ) {
    const d = new Date(t);
    const year = d.getUTCFullYear();
    const doy = Math.floor((t - Date.UTC(year, 0, 1)) / 86_400_000);
    time.push(d.toISOString().slice(0, 10));
    tmax.push(
      Math.round((30 + Math.sin((2 * Math.PI * doy) / 365) + ((year % 5) - 2) * 0.5) * 10) / 10,
    );
    rain.push((doy + year) % 3 === 0 ? 6 : 0);
  }
  return { daily: { time, temperature_2m_max: tmax, precipitation_sum: rain } };
}

function geocodingSearch(url) {
  const name = (url.searchParams.get("name") ?? "").toLowerCase();
  if (name.includes("boom")) return json({ error: true, reason: "mock failure" }, 500);
  if (name.includes("tok")) return json({ results: geocodingTokyo.results.slice(0, 2) });
  if (name.includes("subang")) return json({ results: [geocodingSubang] });
  return json({ generationtime_ms: 0.1 }); // an empty search omits `results`
}

function geocodingGet(url) {
  const id = Number(url.searchParams.get("id"));
  if (id === 8504423) return json(geocodingSubang);
  if (id === tokyoResult.id) return json(tokyoResult);
  return json({ error: true, reason: "Location ID not found." }, 400);
}

function metWarnings() {
  // The captured live feed plus one far-future Selangor warning, so "official alert" has a stable test case.
  const injected = {
    warning_issue: { issued: "2026-10-27T00:00:00", title_en: "Thunderstorms Warning" },
    valid_from: "2026-10-26T00:00:00",
    valid_to: "2099-01-01T00:00:00",
    heading_en: "THUNDERSTORMS WARNING",
    text_en:
      "Thunderstorms, heavy rain and strong winds are expected over the states of Selangor • Perak until 5:00 AM.",
    instruction_en: null,
  };
  return json([injected, ...metFixture]);
}

function radar() {
  const latest = 1793036400;
  const past = Array.from({ length: 13 }, (_, i) => ({
    time: latest - (12 - i) * 600,
    path: `/v2/radar/mock${String(i).padStart(4, "0")}`,
  }));
  return json({
    version: "2.0",
    generated: latest,
    host: "https://tilecache.rainviewer.com",
    radar: { past, nowcast: [] },
  });
}

function route(url) {
  const { hostname, pathname } = url;
  if (hostname === "api.open-meteo.com" && pathname === "/v1/forecast") return forecast(url);
  if (hostname === "air-quality-api.open-meteo.com") {
    return Number(url.searchParams.get("latitude")) === FAIL_LATITUDE
      ? json({ error: true, reason: "mock outage" }, 500)
      : json(airQualityFixture);
  }
  if (hostname === "archive-api.open-meteo.com") {
    return url.searchParams.get("start_date") === "1991-01-01"
      ? json(normalsArchive())
      : json(recentArchive);
  }
  if (hostname === "geocoding-api.open-meteo.com") {
    return pathname === "/v1/search" ? geocodingSearch(url) : geocodingGet(url);
  }
  if (hostname === "api.data.gov.my") return metWarnings();
  if (hostname === "api.weather.gov") return json({ type: "FeatureCollection", features: [] });
  if (hostname === "api.rainviewer.com") return radar();
  return null;
}

globalThis.fetch = async function mockedFetch(input, init) {
  const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(href, "http://localhost");
  const handled = route(url);
  if (handled) return handled;
  // Next.js talks to itself over localhost (image optimiser, internal fetches): let that through.
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return realFetch(input, init);
  console.error(`[mock-upstream] unmocked request: ${url.href}`);
  return json({ error: `unmocked upstream ${url.href}` }, 500);
};
