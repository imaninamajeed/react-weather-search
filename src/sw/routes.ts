/**
 * Which caching strategy each kind of request gets. Pure functions over a URL so they can be
 * unit-tested; sw.ts wires them to Serwist strategies.
 *
 * Principles:
 *  - Content-hashed build assets never change, so cache them for good.
 *  - Pages and API responses are time-sensitive: try the network first, fall back to the cache.
 *  - Anything live (radar) is never cached: an old radar frame is worse than none.
 */

export type Strategy =
  | "cache-first-static"
  | "cache-first-tiles"
  | "stale-while-revalidate-images"
  | "stale-while-revalidate-scripts"
  | "network-first-api"
  | "network-only"
  | null;

const MAP_TILE_HOSTS = new Set(["tiles.openfreemap.org"]);
const LIVE_HOSTS = ["rainviewer.com"];

/** Request kinds the worker treats differently. Navigations are handled separately (see sw.ts). */
export function strategyFor(url: URL, origin: string): Strategy {
  if (LIVE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return "network-only";
  }
  if (MAP_TILE_HOSTS.has(url.hostname)) return "cache-first-tiles";
  if (url.origin !== origin) return null;

  const { pathname } = url;
  // Next fingerprints everything under /_next/static (JS, CSS, fonts), so a URL's bytes never change.
  if (pathname.startsWith("/_next/static/")) return "cache-first-static";
  if (pathname.startsWith("/_next/image") || /^\/(icons|brand|screenshots)\//.test(pathname)) {
    return "stale-while-revalidate-images";
  }
  // The map's web worker is copied into /public at build time.
  if (pathname === "/maplibre-gl-worker.mjs") return "stale-while-revalidate-scripts";
  if (pathname.startsWith("/api/")) return "network-first-api";
  return null;
}

/** Never intercept requests that mutate state or that the service worker must not cache. */
export function isCacheableMethod(method: string): boolean {
  return method === "GET";
}
