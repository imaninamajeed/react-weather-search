import { describe, expect, it } from "vitest";
import { isCacheableMethod, strategyFor } from "./routes";

const ORIGIN = "https://isobar.example";
const strategy = (url: string) => strategyFor(new URL(url, ORIGIN), ORIGIN);

describe("strategyFor", () => {
  it("caches fingerprinted build assets for good", () => {
    expect(strategy("/_next/static/chunks/abc123.js")).toBe("cache-first-static");
    expect(strategy("/_next/static/media/font.woff2")).toBe("cache-first-static");
  });

  it("never caches live radar", () => {
    expect(strategy("https://tilecache.rainviewer.com/v2/radar/abc/256/4/13/5/2/1_1.png")).toBe(
      "network-only",
    );
    expect(strategy("https://api.rainviewer.com/public/weather-maps.json")).toBe("network-only");
  });

  it("caches basemap tiles", () => {
    expect(strategy("https://tiles.openfreemap.org/planet/20260101_000000_pt/4/13/5.pbf")).toBe(
      "cache-first-tiles",
    );
  });

  it("serves images and the map worker stale-while-revalidate", () => {
    expect(strategy("/icons/icon-192.png")).toBe("stale-while-revalidate-images");
    expect(strategy("/_next/image?url=%2Fbrand%2Fmark.webp&w=64&q=75")).toBe(
      "stale-while-revalidate-images",
    );
    expect(strategy("/maplibre-gl-worker.mjs?v=6.16.0")).toBe("stale-while-revalidate-scripts");
  });

  it("prefers the network for API responses", () => {
    expect(strategy("/api/places/search?q=tokyo")).toBe("network-first-api");
    expect(strategy("/api/weather/point?lat=1&lon=2")).toBe("network-first-api");
  });

  it("leaves pages and unknown cross-origin requests to the navigation handler or the browser", () => {
    expect(strategy("/place/8504423-subang-jaya")).toBeNull();
    expect(strategy("/")).toBeNull();
    expect(strategy("https://example.com/anything")).toBeNull();
    // A look-alike host must not be treated as RainViewer or OpenFreeMap.
    expect(strategy("https://rainviewer.com.evil.example/x")).toBeNull();
    expect(strategy("https://evil-tiles.openfreemap.org.example/x")).toBeNull();
  });
});

describe("isCacheableMethod", () => {
  it("only caches GET, so Server Actions and other POSTs always hit the network", () => {
    expect(isCacheableMethod("GET")).toBe(true);
    expect(isCacheableMethod("POST")).toBe(false);
    expect(isCacheableMethod("PUT")).toBe(false);
  });
});
