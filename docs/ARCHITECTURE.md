# Architecture

How Isobar is built, and why. For the user-facing overview see the [README](../README.md).

## Shape of the system

```
Browser ──► Next.js (Vercel) ───────────────► Open-Meteo   forecast · models · air quality · geocoding · ERA5
 │            │  Server Components            MET Malaysia / NWS   official warnings
 │            │  "use cache" + Suspense       RainViewer   radar frames (list only)
 │            │  Route Handlers (2)
 │            └─ Server Actions (preferences cookie)
 │
 ├─► OpenFreeMap tiles, RainViewer tiles (straight from the browser, never proxied)
 └─► Service worker (offline pages, tile and asset caches)
```

There is **no database, no accounts and no secret needed**. All upstream calls are made from the
server, through one client, so the browser never sees an upstream URL except map tiles.

## Rendering model

The app uses Next.js 16 **Cache Components** (`cacheComponents: true`, `partialPrefetching: true`).
Each route is a prerendered static shell with `<Suspense>` holes that stream in:

- The header, footer and page chrome are static.
- Anything that reads the visitor's cookie (units, saved places) or `params`/`searchParams` sits
  inside a `<Suspense>` boundary, so it streams while the shell is already visible.
- Data fetchers are `"use cache"` functions with an explicit `cacheLife`, so they are shared across
  visitors and never fetch twice.

| Route                                                          | Rendering                  | Notes                                                       |
| -------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| `/`                                                            | shell + streamed dashboard | reads the cookie                                            |
| `/places`, `/alerts`                                           | shell + streamed content   | read the cookie; `/alerts` reads `?show=`                   |
| `/place/[key]` and its `/outlook`, `/history`                  | shell + streamed content   | `params` awaited inside `<Suspense>`                        |
| `/map`                                                         | shell + streamed map       | needs the cookie for markers                                |
| `/about`, `/offline`, `/manifest.webmanifest`, icons, OG image | static                     | `/about` thresholds are built from the code's own constants |
| `/api/places/search`, `/api/weather/point`                     | dynamic                    | thin wrappers over cached fetchers                          |

Every section that depends on a different upstream has its **own Suspense boundary and error
boundary** (`catchError`, so `notFound()`/`redirect()` still work). The forecast is the page's core:
if it fails, the page shows an error. Air quality, alerts, forecast confidence, saved-place cards and the
week-ahead table fail alone.

## The data layer (`src/lib/open-meteo`)

- `client.ts`: `fetchJson` adds a timeout, **one** retry for network errors/429/5xx (never for
  other 4xx), and validates the body against a Zod schema. Failures become `UpstreamError`.
- Each upstream has a schema, a pure `normalize…` function (tested against captured real
  responses), and a thin cached fetcher. Normalisation converts to domain types in **metric**; unit
  conversion happens only at render (`lib/units.ts`).
- Coordinates are rounded to 2 decimals (~1 km) _before_ the cached call, so nearby requests share
  one cache entry and less precise location data reaches upstream.
- All fetchers import `server-only`, so an upstream URL or optional key cannot reach a client bundle.

Cache lifetimes (`next.config.ts` custom profiles plus presets):

| Data                             | Profile      | stale / revalidate / expire |
| -------------------------------- | ------------ | --------------------------- |
| Forecast, current conditions     | `forecast`   | 5 min / 15 min / 1 h        |
| Air quality                      | `airQuality` | 5 min / 1 h / 1 day         |
| Official alerts                  | `alerts`     | 5 min / 5 min / 30 min      |
| Radar frame list                 | `radar`      | 1 min / 5 min / 30 min      |
| Three-model comparison           | `hours`      | 5 min / 1 h / 1 day         |
| Place search, recent archive     | `days`       | 5 min / 1 day / 1 week      |
| Place by ID, **climate normals** | `max`        | 5 min / 30 days / 1 year    |

`expire` is kept above 5 minutes so these entries still take part in prerendering (shorter
lifetimes turn into request-time holes).

## Domain logic (`src/lib/weather`, `src/lib/alerts`)

Kept pure and dependency-free so it can be tested exhaustively: WMO weather codes, units and
formatting, the "today" summary, UV windows, AQI bands, hazard detection, confidence rating, climate
normals and comparison, place keys, preference parsing and mutation.

**Time is never converted.** Open-Meteo returns wall-clock times in the place's timezone as naive
strings. They are formatted by treating the digits as UTC and printing with `timeZone: "UTC"`, which
reproduces the same wall-clock digits regardless of the server's or viewer's zone. This is the fix for
the original app's timezone bug (audit #6).

### Alerts

Two layers, always distinguishable in the UI:

1. **Official**: MET Malaysia (land warnings only; marine bulletins, expired entries and the
   "No Advisory" placeholder are dropped; state and district names in the free text are matched
   against the place) and the US NWS (offset timestamps converted to the place's wall clock).
2. **Forecast signals**: `detectHazards()` over the next 72 hourly and 7 daily values. Thresholds
   live in one documented constant. UV is deliberately _not_ an alert (it would fire daily in the tropics).

`getPlaceAlerts` never throws: a feed outage is returned as source status, and the UI says it
couldn't check rather than implying "all clear".

### Forecast confidence

Daily highs and rainfall from ECMWF, GFS and ICON. Spread in the daily high sets the level
(≤ 2 °C high, ≤ 3.5 °C medium, wider low); models splitting on wet vs dry, or differing widely on
rainfall, lower it one more step. The summary is rule-based text, not generated.

### Climate history

The last 12 months against 1991–2020 normals from ERA5: per-calendar-day percentiles pooled over
±7 days, plus mean monthly rainfall. The 30-year pull (~300 KB, ~2 s) is reduced to a few hundred
numbers and cached permanently, so only the first visit to a place is slow.

> **A lesson worth keeping:** the archive API's default "best match" blends datasets over time. The
> baseline came out ~1.5 °C cooler than the same period from ERA5 itself, which made the latest year
> look 2.6 °C "warmer than normal". Both queries now pin `models=era5`. With a like-for-like baseline
> the same place shows about +0.9 °C.

## Personalisation

One cookie, `wx`: `{ units, places[≤10], homeKey }`. It is read on the server, so the dashboard
renders personalised with no loading flash and no login.

- It is parsed **tolerantly**: each field and each saved place is validated and dropped
  individually, so a corrupt cookie degrades to defaults instead of breaking the app.
- It is not signed. It holds only the visitor's own non-sensitive settings, tampering can only
  change their own view, and signing would add a required secret for no security gain.
- It is `httpOnly`, `SameSite=Lax`, `Secure` in production, one year.
- **Server Actions treat their input as untrusted**: places are re-resolved from their _key_ on the
  server, never taken from the client; enums are validated.
- Every change shows a toast with **Undo**. Undoing a removal restores the place's position _and_
  its home status (an e2e test covers it).
- First-visit units come from `Accept-Language` (US, Liberia and Myanmar → imperial).
- Recent searches are per-device (`localStorage`), never sent anywhere.

### App shell

`SidebarProvider` wraps the app in `layout.tsx`: a collapsible `AppSidebar` (navigation, plus the home
and saved places), and a `SidebarInset` holding the offline banner, a slim `TopBar` (sidebar trigger,
search, settings), the page and the footer. On mobile the sidebar is a drawer that closes when you
navigate.

Two details come from Cache Components:

- **The saved places in the sidebar read the cookie**, so they stream in behind a skeleton instead of
  making every route dynamic.
- **The active-link highlight reads the URL**, which is request-time data on dynamic routes, so each
  link renders without the highlight in the prerendered shell and gains it when it streams in
  (`SidebarNavLink` wraps `ActiveNavLink` in `<Suspense>`).

**Breadcrumbs are a parallel route.** `layout.tsx` receives a `crumbs` slot (`app/@crumbs`) and passes it to
the `TopBar`, so the trail sits in the header beside the sidebar toggle while each page owns its own
trail in `@crumbs/<route>/page.tsx` (with a `default.tsx` that renders nothing). Place pages need the place's
name, which requires awaiting `params` and the cookie, so those crumbs stream inside `<Suspense>` with the
generic trail as the fallback. See [INFORMATION_ARCHITECTURE](INFORMATION_ARCHITECTURE.md) for why the app is
split into these pages.

The sidebar remembers collapsed/expanded in a cookie it expects the _server_ to read. Doing that in the
root layout would make every route dynamic, so `SidebarStateRestore` applies the saved state on the client
instead, at the cost of a brief expanded flash for visitors who keep it collapsed.

## The map

MapLibre GL with OpenFreeMap tiles (following the theme) and RainViewer radar.

- MapLibre is loaded on demand with `import()`, so only `/map` pays for it.
- Each radar frame is a raster layer; showing a frame is an opacity change. Only the visible frame
  is requested until the visitor plays or scrubs, because RainViewer rate-limits (500 requests/min)
  and eager loading cost ~100 requests per page view.
- RainViewer serves a "Zoom Level Not Supported" placeholder above zoom 7, so the layer stops at 7 and MapLibre scales it.
- The third-party host and tile paths are validated by regex before they become tile URLs.
- MapLibre locates its web worker relative to its own module URL, which the bundler rewrites. A
  build script copies the (self-contained) worker into `public/` and `setWorkerUrl()` points at it.

## PWA

- Manifest with maskable icon, shortcuts and install screenshots; "Install app" in the settings menu.
- The service worker uses the `serwist` runtime, bundled by esbuild into `public/sw.js` at build
  time. It uses **runtime caching only**, so no build manifest has to be injected:
  fingerprinted assets and map tiles cache-first, pages and API network-first (3–4 s timeout),
  images stale-while-revalidate, **radar never cached**, non-GET never touched. Routing rules
  are pure functions with unit tests, including look-alike-host cases.
- Visited pages keep working offline; others show `/offline`. An offline banner says what still
  works, and actions that need the server are disabled with an explanation.
- Registration is production-only so development never serves stale caches. `/sw.js` is served
  `no-cache` with `Service-Worker-Allowed: /`.

## Design system

The UI is built on shadcn/ui and themed by the preset **`b5sh7fs7oA`** (`radix-luma` style, `mist` base,
Tabler icons, Outfit for text and Oxanium for headings), applied with `shadcn apply`. Components
live in `src/components/ui/` as owned code.

A preset replaces theme tokens and re-generates the primitives, so a few things are deliberately
kept on top of it. **After re-applying a preset, re-check these:**

| Kept                                                                                                               | Why                                                                                                                                                                                                                                                    | Where                                   |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Categorical `--chart-1…5` hues                                                                                     | The preset ships a single-hue ramp, which makes multi-series charts (temperature vs feels-like, the three weather models) indistinguishable. These were validated for colour-blind separation and contrast against the theme's surfaces in both modes. | `globals.css`                           |
| Darker light-mode `--muted-foreground` (0.52 instead of 0.56)                                                      | The preset's value reaches only ~4.2:1 on tinted surfaces such as alert cards; this clears 4.5:1 everywhere (caught by the axe tests).                                                                                                                 | `globals.css`                           |
| `thumbLabel` / `valueText` on `Slider`                                                                             | Radix doesn't pass `aria-label` to the thumb, so the radar scrubber would have no accessible name.                                                                                                                                                     | `ui/slider.tsx`                         |
| Dialog title inside `DialogContent` in `CommandDialog`                                                             | Otherwise a stray heading exists on every page while the dialog is closed.                                                                                                                                                                             | `ui/command.tsx`                        |
| Lucide for the 12 weather-condition glyphs                                                                         | Tabler has no partly-cloudy, drizzle or hail icons; substituting would make "partly cloudy" look like "overcast". Every other icon is Tabler.                                                                                                          | `components/shared/weather-icon.tsx`    |
| `SidebarInset` renders a `div`, deterministic `SidebarMenuSkeleton` width, `useIsMobile` on `useSyncExternalStore` | The generated sidebar nests a second `<main>` inside every page, uses `Math.random()` (rejected in a prerendered shell) and sets state in an effect (rejected by the React Compiler lint).                                                             | `ui/sidebar.tsx`, `hooks/use-mobile.ts` |
| Semantic `--advisory` / `--warning` tokens and the `.label-caps` / `.tnum` utilities                               | App-specific; not part of any preset.                                                                                                                                                                                                                  | `globals.css`                           |

The end-to-end suite (axe-core in both themes) and the typechecker catch most regressions here: the
first two rows fail the accessibility checks, and a lost `thumbLabel` fails `tsc`.

## Testing strategy

- **Pure logic** gets table-driven unit tests against _real_ captured responses (including awkward
  ones: a 110 mm single-model rainfall outlier, a gap day in ERA5 data, marine bulletins in the MET feed).
- **Components with real logic** (search race handling) get jsdom tests.
- **End to end**: production build, every upstream replaced by fixtures through a `fetch`-patching
  preload loaded with `NODE_OPTIONS=--import`. The seam lives in the test process, so production
  code has no test hooks and an unmocked request fails loudly. Special coordinates trigger
  upstream failures. axe-core runs on every page in both themes.

## Security and privacy

- No secrets in the client; optional keys are server-only and read from the environment.
- Third-party data is validated (Zod) at the boundary; tile hosts/paths are regex-checked; popups and map markers are built with the DOM API, never `innerHTML`.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (geolocation limited to self).
- **No CSP**, deliberately: a nonce-based policy forces every route to render dynamically, which
  defeats the prerendered shell. The trade-off is documented in `next.config.ts`.
- No analytics, no third-party scripts, no tracking. Coordinates are rounded before leaving the server.

## Decisions and trade-offs

| Decision                                           | Why                                                                                                                                   | Cost                                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Open-Meteo instead of OpenWeather                  | Keyless (nothing to leak); forecast, multi-model, air quality, geocoding and ERA5 from one provider.                                  | Free tier is non-commercial; a commercial deployment needs a key.                                                                              |
| Cookie instead of accounts/database                | The whole product works without sign-in; personalised first paint; far less to build, secure and operate.                             | No cross-device sync.                                                                                                                          |
| Cache Components + Suspense per section            | Instant shell, independent failure and streaming per upstream.                                                                        | `notFound()`/`redirect()` inside a streamed section return HTTP 200 (`noindex` / meta refresh), not 404/308, because headers are already sent. |
| Forecast signals alongside official alerts         | Official feeds only exist for some countries; the rest of the world still gets _something_.                                           | Heuristics can be wrong, so they are labelled and ranked below official ones.                                                                  |
| `serwist` core + esbuild, not `@serwist/turbopack` | The Turbopack integration is a route handler exporting segment config (`dynamic`, `revalidate`) that Cache Components does not allow. | A small build script to maintain.                                                                                                              |
| Fixtures via fetch preload, not Next's test proxy  | The test proxy is undocumented/experimental; this needs only Node.                                                                    | The preload must mirror the upstream URL shapes.                                                                                               |
| No per-place Open Graph images                     | A static brand image covers sharing; per-place images would add an upstream dependency to image generation.                           | Shared place links show the generic card.                                                                                                      |
| Charts: Recharts via shadcn `chart`                | Accessible-enough primitives and consistent theming; each chart has a table twin.                                                     | Recharts is a large dependency (client-only, per route).                                                                                       |

## Known limitations and next steps

- Push notifications for alerts would need stored subscriptions (a database) and a scheduled
  checker, which conflicts with the no-accounts design; the natural next step if sync is ever added.
- Chromium is the only automatically tested browser.
- Official-warning coverage is MY and US only; other national feeds could be added behind the same adapter shape (`matchX(place, feed, now) → OfficialAlert[]`).
- The search endpoint is unauthenticated and un-rate-limited; it depends on upstream caching.
- The Vercel deployment itself was not exercised from the build environment.
