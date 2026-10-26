/// <reference lib="webworker" />
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type RuntimeCaching,
} from "serwist";
import { isCacheableMethod, strategyFor } from "./routes";

declare const self: ServiceWorkerGlobalScope;
/** Injected by scripts/build-sw.mjs so a new deploy refreshes the precached offline page. */
declare const BUILD_REVISION: string;

const DAY = 24 * 60 * 60;
const OK = new CacheableResponsePlugin({ statuses: [0, 200] });

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, url }) =>
      isCacheableMethod(request.method) &&
      strategyFor(url, self.location.origin) === "network-only",
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request, url }) =>
      isCacheableMethod(request.method) &&
      strategyFor(url, self.location.origin) === "cache-first-static",
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        OK,
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true }),
      ],
    }),
  },
  {
    matcher: ({ request, url }) =>
      isCacheableMethod(request.method) &&
      strategyFor(url, self.location.origin) === "cache-first-tiles",
    handler: new CacheFirst({
      cacheName: "map-tiles",
      plugins: [
        OK,
        new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 7 * DAY, purgeOnQuotaError: true }),
      ],
    }),
  },
  {
    matcher: ({ request, url }) =>
      isCacheableMethod(request.method) &&
      strategyFor(url, self.location.origin) === "stale-while-revalidate-images",
    handler: new StaleWhileRevalidate({
      cacheName: "images",
      plugins: [
        OK,
        new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true }),
      ],
    }),
  },
  {
    matcher: ({ request, url }) =>
      isCacheableMethod(request.method) &&
      strategyFor(url, self.location.origin) === "stale-while-revalidate-scripts",
    handler: new StaleWhileRevalidate({ cacheName: "scripts", plugins: [OK] }),
  },
  {
    matcher: ({ request, url }) =>
      isCacheableMethod(request.method) &&
      strategyFor(url, self.location.origin) === "network-first-api",
    handler: new NetworkFirst({
      cacheName: "api",
      networkTimeoutSeconds: 4,
      plugins: [OK, new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 })],
    }),
  },
  {
    // Pages: the network wins when it answers within 3 s, so forecasts stay fresh; otherwise (slow
    // or offline) the last copy of that page is shown. Pages that were never visited fall through
    // to the offline page below.
    matcher: ({ request }) => request.mode === "navigate",
    handler: new NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 3,
      plugins: [OK, new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: DAY })],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: [{ url: "/offline", revision: BUILD_REVISION }],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
