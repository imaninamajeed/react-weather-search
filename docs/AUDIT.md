# Audit of the original app

The original was a Create React App project (commit `c8a49ff`): a city search box, a current-conditions
panel and a five-day forecast from the OpenWeatherMap API, about 300 lines of JavaScript.
This is what I found when reading it, and what became of each issue. File and line references are
to that commit.

Method: I read all of the source, checked the layout and behaviour against what the code does, and
measured assets. I did **not** call the OpenWeather API with the committed key (it isn't mine to
exercise), so the first finding rests on OpenWeather's published deprecation, not on a live test.

## Summary

| #   | Severity | Finding                                                        | Resolution                                      |
| --- | -------- | -------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Critical | The forecast endpoint has been retired                         | Moved to Open-Meteo                             |
| 2   | Critical | API key hardcoded in client code (and in git history)          | No secret needed; **key must be revoked**       |
| 3   | High     | Network requests fire during render; no cancellation           | Server-side fetching; abortable client search   |
| 4   | High     | No error handling; app can hang on "Loading…" forever          | Error boundaries per section, explicit messages |
| 5   | High     | Wind speed shown in the wrong unit                             | Explicit unit handling, tested                  |
| 6   | High     | Times and weekdays use the _viewer's_ timezone, not the city's | Wall-clock formatting, tested                   |
| 7   | Medium   | Search input unvalidated, unencoded, empty submits allowed     | Validated and normalised on server and client   |
| 8   | Medium   | Accessibility gaps                                             | WCAG 2.2 AA target, axe-tested on every page    |
| 9   | Medium   | Layout doesn't adapt to small screens                          | Mobile-first, checked at 375 px                 |
| 10  | Medium   | The only test cannot pass                                      | 213 unit + 34 e2e tests                         |
| 11  | Low      | Deprecated and unused tooling                                  | Next.js 16, TypeScript, pnpm                    |
| 12  | Low      | Boilerplate and hygiene                                        | Real metadata, README, assets, docs             |

## Findings in detail

### 1. The forecast endpoint has been retired (critical)

`WeatherForecast.js:23` requests `https://api.openweathermap.org/data/2.5/onecall`. OpenWeather
decommissioned the One Call 2.5 API in 2024 (it was replaced by the separate, billing-gated One Call
3.0), so the five-day forecast strip cannot load. Because of finding 4, nothing tells the user: the
component just renders nothing.

_Resolution:_ all weather data now comes from Open-Meteo, which is keyless and covers forecasts, air
quality, geocoding and 80+ years of reanalysis from one provider.

### 2. Hardcoded API key (critical)

The key is in client code (`Weather.js:37`, `WeatherForecast.js:20`), so it ships to every visitor's
browser, and in the repository's git history.

_Resolution:_ the new app needs no key, so there is nothing to leak. The old key remains public in
history (history was deliberately not rewritten), so **it should be revoked in the OpenWeather
account**. Optional secrets (`OPEN_METEO_API_KEY`) are read only on the server.

### 3. Requests during render (high)

`Weather.js:70-73` and `WeatherForecast.js:46-49` call `search()` / `load()` inside the render path
when data isn't ready. Under `React.StrictMode` (enabled in `index.js`) render runs twice in
development, so requests duplicate; there is no `AbortController`, so two quick searches can resolve
out of order and show the older city.

_Resolution:_ data is fetched on the server in Server Components and cached. The one remaining
client request, search autocomplete, is debounced and aborts the previous request; a component
test (`search-command.test.tsx`) proves a slow, older response can't overwrite a newer one.

### 4. No error handling (high)

`axios.get(apiUrl).then(handleResponse)` (`Weather.js:39`) has no `catch`. A misspelt city rejects
unhandled and the UI does nothing; if the very first load fails the app shows "Loading..." forever
(`Weather.js:72`).

_Resolution:_ every failure has a visible state: not-found pages, per-section error boundaries with
"Try again", search messages for empty and failed lookups, and alerts that say when a feed was
unreachable. One failing upstream degrades one card (tested end to end).

### 5. Wrong wind unit (high)

`WeatherInfo.js:17` labels the value `km/h`, but the request uses `units=metric`
(`Weather.js:38`), for which OpenWeather returns wind in **metres per second**. Every wind speed was
understated by a factor of 3.6.

_Resolution:_ data is requested in explicit units (`wind_speed_unit=kmh`), stored metric, and
converted in one tested module (`lib/units.ts`).

### 6. Viewer's timezone instead of the city's (high)

`FormattedDate.js:13-19` and `WeatherForecastDay.js:16-17` build `new Date(unix * 1000)` and call
`getDay()` / `getHours()`, which use the _browser's_ timezone. Searching Tokyo from Kuala Lumpur shows
Kuala Lumpur's clock, and forecast weekday labels can be off by a day.

_Resolution:_ the API returns wall-clock times in the place's own timezone; they are formatted
without ever passing through the viewer's timezone (`lib/format.ts`). Regression tests pin this, and
an e2e test checks that Tokyo shows its own UTC offset.

### 7. Input handling (medium)

The city goes into the URL by template string (`Weather.js:38`) with no encoding, an empty
submission is allowed, and `autoFocus="on"` (`Weather.js:53`) is not a valid value.

_Resolution:_ queries are trimmed, length-limited and URL-encoded; short queries never reach the
network; place keys are parsed strictly and bad ones 404.

### 8. Accessibility (medium)

The search `<input>` has no label (`Weather.js:49-55`); weather icons are `<canvas>` elements with no
text alternative (via `react-animated-weather`); the logo has `alt="Logo"`; there are no landmarks
(`<main>`, `<header>`) or skip link; the footer is 11 px.

_Resolution:_ a labelled combobox (cmdk/Radix), icons are decorative with the condition written next
to them, landmarks and a skip link, a text/table alternative for every chart, `prefers-reduced-motion`
respected, and axe-core running on every page in both themes in CI. It found one more real bug
during development, which was fixed.

### 9. Layout (medium)

Fixed Bootstrap columns (`col-7` + `col-3`, `WeatherInfo.js:11-21`) inside a 600 px container don't
reflow on narrow screens.

_Resolution:_ mobile-first layouts verified at 375 px, including a regression check that no page
scrolls horizontally.

### 10. Tests (medium)

`App.test.js` renders `<App />` and looks for text matching "learn react", which the app doesn't
contain, so the only test cannot pass.

_Resolution:_ 213 unit/component tests and 34 end-to-end tests (see README).

### 11. Tooling (low)

Create React App is deprecated; `react-animated-weather` is unmaintained; Bootstrap and axios were
pulled in for a handful of classes and one `GET`; the package was named `test`.

_Resolution:_ Next.js 16 (App Router, Cache Components), TypeScript strict, Tailwind CSS 4 and
shadcn/ui, native `fetch`, pnpm.

### 12. Hygiene (low)

Boilerplate README, `<title>React App</title>` and CRA meta description, duplicated CSS rules, a
435 KB PNG used as a 150 px logo, and a footer pointing at a Netlify deployment.

_Resolution:_ real metadata and Open Graph image, a manifest and icon set generated from the
original marble logo (kept as the brand mark), documentation, and a Vercel-targeted setup.

## Kept from the original

- The core flow: search a city, see current conditions and a forecast.
- **Subang Jaya as the default city.**
- The marble logo and its turquoise/magenta palette, which now drives the UI.
- Credit to the original author in the footer and licence.
