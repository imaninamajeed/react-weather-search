import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { THRESHOLDS as T } from "@/lib/alerts/hazards";
import { NORMALS_PERIOD } from "@/lib/weather/climate";
import { CONFIDENCE_THRESHOLDS as C } from "@/lib/weather/confidence";

export const metadata: Metadata = {
  title: "Data and methods",
  description:
    "Where Isobar's numbers come from, how alerts and forecast confidence are worked out, and what it can't tell you.",
};

const linkClass = "underline decoration-border underline-offset-4 hover:decoration-foreground";

function Source({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const Strong = ({ children }: { children: string }) => (
  <strong className="font-medium text-foreground">{children}</strong>
);

// Built from the same constants the detection code uses, so this table cannot drift from behaviour.
const HAZARD_ROWS: Array<[hazard: string, advisory: string, warning: string, basis: string]> = [
  [
    "Thunderstorms",
    `Thunderstorm forecast with ≥ ${T.thunderstormProbability}% chance of rain`,
    "Thunderstorm with hail",
    "Hourly, next 72 hours",
  ],
  [
    "Intense rain",
    `≥ ${T.rainRate.advisory} mm/h`,
    `≥ ${T.rainRate.warning} mm/h`,
    "Hourly, next 72 hours",
  ],
  [
    "Heavy rain",
    `≥ ${T.rainTotal.advisory} mm in a day`,
    `≥ ${T.rainTotal.warning} mm in a day`,
    "Daily, next 7 days",
  ],
  [
    "Strong gusts",
    `≥ ${T.gusts.advisory} km/h`,
    `≥ ${T.gusts.warning} km/h`,
    "Hourly, next 72 hours",
  ],
  [
    "Heat",
    `Highs ≥ ${T.heat.advisory} °C on ${T.heat.minDays}+ days in a row`,
    `Highs ≥ ${T.heat.warning} °C on ${T.heat.minDays}+ days in a row`,
    "Daily, next 7 days",
  ],
  ["Frost", `Lows ≤ ${T.frost.advisory} °C`, `Lows ≤ ${T.frost.warning} °C`, "Daily, next 7 days"],
  [
    "Heavy snow",
    `≥ ${T.snow.advisory} cm in a day`,
    `≥ ${T.snow.warning} cm in a day`,
    "Daily, next 7 days",
  ],
  ["Air quality", `US AQI ≥ ${T.aqi.advisory}`, `US AQI ≥ ${T.aqi.warning}`, "Current reading"],
];

/** The page's sections, for the contents list beside them on large screens. */
const SECTIONS = [
  ["sources", "Data sources"],
  ["alerts", "How alerts work"],
  ["confidence", "How forecast confidence works"],
  ["climate", "How climate history works"],
  ["privacy", "Privacy"],
  ["limits", "What it can't tell you"],
  ["credits", "Credits"],
] as const;

export default function AboutPage() {
  return (
    <main
      data-fit
      id="main"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 fit:py-2 fit:pb-3"
    >
      <div className="flex flex-col gap-10 fit:min-h-0 fit:flex-1 fit:gap-3">
        <PageHeader
          label="About"
          title="Data and methods"
          lead="Where the numbers come from, how alerts and forecast confidence are worked out, and what this app can't tell you."
        />

        <div className="contents fit:grid fit:min-h-0 fit:flex-1 fit:grid-cols-12 fit:gap-3">
          <nav
            aria-label="On this page"
            className="hidden self-start rounded-4xl bg-card p-4 shadow-md ring-1 ring-foreground/5 fit:col-span-3 fit:block"
          >
            <ul className="space-y-1 text-sm">
              {SECTIONS.map(([id, title]) => (
                <li key={id}>
                  <a href={`#${id}`} className="block rounded-md px-3 py-1.5 hover:bg-accent">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="contents fit:col-span-9 fit:block fit:min-h-0 fit:space-y-10 fit:overflow-y-auto fit:scroll-smooth fit:rounded-4xl fit:bg-card fit:p-6 fit:shadow-md fit:ring-1 fit:ring-foreground/5 fit:*:first:border-0 fit:*:first:pt-0">
            <Section id="sources" title="Data sources">
              <Table aria-label="Data sources">
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Used for</TableHead>
                    <TableHead>Terms</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Source href="https://open-meteo.com/">Open-Meteo</Source>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      Forecasts, the three-model comparison (ECMWF, GFS, ICON), air quality, place
                      search and the ERA5 climate record
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      CC BY 4.0, free for non-commercial use
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Source href="https://www.met.gov.my/">MET Malaysia</Source>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      Official warnings for Malaysia, via{" "}
                      <Source href="https://data.gov.my/">data.gov.my</Source>
                    </TableCell>
                    <TableCell className="whitespace-normal">Open data</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Source href="https://www.weather.gov/documentation/services-web-api">
                        US National Weather Service
                      </Source>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      Official alerts for US places
                    </TableCell>
                    <TableCell className="whitespace-normal">US government data</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Source href="https://www.rainviewer.com/">RainViewer</Source>
                    </TableCell>
                    <TableCell className="whitespace-normal">Radar images on the map</TableCell>
                    <TableCell className="whitespace-normal">
                      Free tier: coarse zoom levels and a request limit
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Source href="https://openfreemap.org/">OpenFreeMap</Source>
                    </TableCell>
                    <TableCell className="whitespace-normal">Map tiles</TableCell>
                    <TableCell className="whitespace-normal">
                      © OpenMapTiles, data © OpenStreetMap contributors
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Section>

            <Section id="alerts" title="How alerts work">
              <div className="max-w-prose space-y-3 text-muted-foreground">
                <p>
                  Alerts come in two kinds, and the app always says which one you&apos;re looking
                  at. <Strong>Official</Strong> warnings are published by a national weather service
                  (MET Malaysia and the US National Weather Service) and are shown first.{" "}
                  <Strong>Forecast signals</Strong> are our own reading of the forecast against the
                  thresholds below. They exist because most countries have no feed we can use, but
                  they are not warnings and can be wrong.
                </p>
                <p>
                  Official warnings are matched to a place by name (state and district), so a
                  district-level warning can be missed; the matching is built to miss rather than
                  raise a false alarm. Each official alert links to its issuer for the authoritative
                  text. If a feed can&apos;t be reached, the app says so rather than implying there
                  is nothing to report.
                </p>
              </div>

              <Table aria-label="Forecast signal thresholds" className="mt-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>Hazard</TableHead>
                    <TableHead>Advisory when</TableHead>
                    <TableHead>Warning when</TableHead>
                    <TableHead>Looks at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HAZARD_ROWS.map(([hazard, advisory, warning, basis]) => (
                    <TableRow key={hazard}>
                      <TableCell className="font-medium">{hazard}</TableCell>
                      <TableCell className="whitespace-normal">{advisory}</TableCell>
                      <TableCell className="whitespace-normal">{warning}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {basis}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 max-w-prose text-sm text-muted-foreground">
                Thresholds are shown in metric here; elsewhere the app converts to your units. UV is
                deliberately not an alert: in the tropics it is very high every day, so it would
                fire constantly and teach people to ignore alerts. It appears under current
                conditions instead.
              </p>
            </Section>

            <Section id="confidence" title="How forecast confidence works">
              <div className="max-w-prose space-y-3 text-muted-foreground">
                <p>
                  Three independent weather models (ECMWF, GFS and ICON) each forecast the same
                  days. Where they agree the forecast is solid; where they spread apart, the real
                  answer is uncertain.
                </p>
                <p>
                  For each day the models&apos; daily highs are compared. Within {C.highMaxSpread}{" "}
                  °C of each other is <Strong>high</Strong> confidence, within {C.mediumMaxSpread}{" "}
                  °C is <Strong>medium</Strong>, and wider is <Strong>low</Strong>. The rating drops
                  one more step when the models split on whether it will rain at all (under {C.dry}{" "}
                  mm against at least {C.wet} mm), or when their rainfall totals differ by at least{" "}
                  {C.amountGap} mm and by half of the wettest model&apos;s total. The models cover
                  seven days; beyond that, days are marked as indicative only.
                </p>
              </div>
            </Section>

            <Section id="climate" title="How climate history works">
              <div className="max-w-prose space-y-3 text-muted-foreground">
                <p>
                  The climate page compares the last twelve months with what is normal for that
                  place, using {NORMALS_PERIOD.start.slice(0, 4)}–{NORMALS_PERIOD.end.slice(0, 4)}{" "}
                  as the baseline. Both come from the ERA5 reanalysis, pinned to the same dataset on
                  purpose: mixing datasets made recent years look several degrees warmer than they
                  were.
                </p>
                <p>
                  &quot;Normal&quot; for a day is the middle 80% of daily highs on the same calendar
                  day, pooled across a week either side, over the thirty baseline years. Values
                  describe the surrounding area rather than a single station, and the most recent
                  days run a few days behind.
                </p>
              </div>
            </Section>

            <Section id="privacy" title="Privacy">
              <ul className="max-w-prose list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  Your saved places, home place and units are stored in a cookie on this device.
                  There are no accounts.
                </li>
                <li>
                  Recent searches are kept in this browser&apos;s local storage and never leave it.
                </li>
                <li>
                  Weather requests are made by our server, not your browser, and coordinates are
                  rounded to about a kilometre first.
                </li>
                <li>
                  The map is the exception: tiles and radar images load straight from OpenFreeMap
                  and RainViewer, so they see your IP address like any site you visit.
                </li>
                <li>There are no analytics, advertising or tracking scripts.</li>
              </ul>
            </Section>

            <Section id="limits" title="What it can't tell you">
              <ul className="max-w-prose list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  Forecast signals are heuristics, not warnings. For anything safety-critical, rely
                  on your national weather service.
                </li>
                <li>
                  Forecasts are model output on a grid, not a measurement at your door, so local
                  effects such as a single storm cell can differ.
                </li>
                <li>Saved places don&apos;t sync across devices.</li>
                <li>
                  Official warnings are only available for Malaysia and the United States so far.
                </li>
              </ul>
            </Section>

            <Section id="credits" title="Credits">
              <p className="max-w-prose text-muted-foreground">
                Isobar grew out of a React weather-search project and is released under the MIT
                licence. Weather data by{" "}
                <Source href="https://open-meteo.com/">Open-Meteo.com</Source>.
              </p>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}
