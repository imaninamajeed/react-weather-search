"use client";

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
import { useMessages } from "@/lib/i18n/client";
import { NORMALS_PERIOD } from "@/lib/weather/climate";
import { CONFIDENCE_THRESHOLDS as C } from "@/lib/weather/confidence";

const linkClass = "underline decoration-border underline-offset-4 hover:decoration-foreground";

function Source({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const strong = (text: string) => <strong className="font-medium text-foreground">{text}</strong>;

const SECTION_IDS = [
  "sources",
  "alerts",
  "confidence",
  "climate",
  "privacy",
  "limits",
  "credits",
] as const;

/**
 * The page's text in the visitor's language. The page itself is prerendered, so this is the one
 * client component holding all of it. The hazard table is built from the same constants the
 * detection code uses, so it cannot drift from behaviour.
 */
export function AboutContent() {
  const t = useMessages().about;
  const a = t.alerts;

  const hazardRows: Array<[hazard: string, advisory: string, warning: string, basis: string]> = [
    [
      a.names.thunderstorms,
      a.thunderstormAdvisory(T.thunderstormProbability),
      a.thunderstormWarning,
      a.basis.hourly72,
    ],
    [
      a.names.intenseRain,
      `≥ ${T.rainRate.advisory} mm/h`,
      `≥ ${T.rainRate.warning} mm/h`,
      a.basis.hourly72,
    ],
    [
      a.names.heavyRain,
      a.inADay(`≥ ${T.rainTotal.advisory} mm`),
      a.inADay(`≥ ${T.rainTotal.warning} mm`),
      a.basis.daily7,
    ],
    [a.names.gusts, `≥ ${T.gusts.advisory} km/h`, `≥ ${T.gusts.warning} km/h`, a.basis.hourly72],
    [
      a.names.heat,
      a.heat(T.heat.advisory, T.heat.minDays),
      a.heat(T.heat.warning, T.heat.minDays),
      a.basis.daily7,
    ],
    [a.names.frost, a.frostLows(T.frost.advisory), a.frostLows(T.frost.warning), a.basis.daily7],
    [
      a.names.snow,
      a.inADay(`≥ ${T.snow.advisory} cm`),
      a.inADay(`≥ ${T.snow.warning} cm`),
      a.basis.daily7,
    ],
    [a.names.airQuality, a.aqi(T.aqi.advisory), a.aqi(T.aqi.warning), a.basis.current],
  ];

  return (
    <div className="flex flex-col gap-10 fit:gap-3">
      <PageHeader label={t.label} title={t.title} lead={t.lead} />

      <div className="contents fit:grid fit:grid-cols-12 fit:gap-3">
        <nav
          aria-label={t.onThisPage}
          className="hidden self-start rounded-4xl bg-card p-4 shadow-md ring-1 ring-foreground/5 fit:col-span-3 fit:block"
        >
          <ul className="space-y-1 text-sm">
            {SECTION_IDS.map((id) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-md px-3 py-1.5 hover:bg-accent">
                  {t.sections[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="contents fit:col-span-9 fit:block fit:space-y-10 fit:scroll-smooth fit:rounded-4xl fit:bg-card fit:p-6 fit:shadow-md fit:ring-1 fit:ring-foreground/5 fit:*:first:border-0 fit:*:first:pt-0">
          <Section id="sources" title={t.sections.sources}>
            <Table aria-label={t.sections.sources}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.sources.source}</TableHead>
                  <TableHead>{t.sources.usedFor}</TableHead>
                  <TableHead>{t.sources.terms}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <Source href="https://open-meteo.com/">Open-Meteo</Source>
                  </TableCell>
                  <TableCell className="whitespace-normal">{t.sources.openMeteo}</TableCell>
                  <TableCell className="whitespace-normal">{t.sources.openMeteoTerms}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Source href="https://www.met.gov.my/">MET Malaysia</Source>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {t.sources.metMalaysia(
                      <Source href="https://data.gov.my/">data.gov.my</Source>,
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal">{t.sources.openData}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Source href="https://www.weather.gov/documentation/services-web-api">
                      US National Weather Service
                    </Source>
                  </TableCell>
                  <TableCell className="whitespace-normal">{t.sources.nws}</TableCell>
                  <TableCell className="whitespace-normal">{t.sources.nwsTerms}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Source href="https://www.rainviewer.com/">RainViewer</Source>
                  </TableCell>
                  <TableCell className="whitespace-normal">{t.sources.rainViewer}</TableCell>
                  <TableCell className="whitespace-normal">{t.sources.rainViewerTerms}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Source href="https://openfreemap.org/">OpenFreeMap</Source>
                  </TableCell>
                  <TableCell className="whitespace-normal">{t.sources.openFreeMap}</TableCell>
                  <TableCell className="whitespace-normal">{t.sources.openFreeMapTerms}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Section>

          <Section id="alerts" title={t.sections.alerts}>
            <div className="max-w-prose space-y-3 text-muted-foreground">
              <p>{a.intro(strong)}</p>
              <p>{a.matching}</p>
            </div>

            <Table aria-label={a.tableLabel} className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>{a.hazard}</TableHead>
                  <TableHead>{a.advisoryWhen}</TableHead>
                  <TableHead>{a.warningWhen}</TableHead>
                  <TableHead>{a.looksAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hazardRows.map(([hazard, advisory, warning, basis]) => (
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
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">{a.note}</p>
          </Section>

          <Section id="confidence" title={t.sections.confidence}>
            <div className="max-w-prose space-y-3 text-muted-foreground">
              <p>{t.confidence.intro}</p>
              <p>
                {t.confidence.method(strong, {
                  high: C.highMaxSpread,
                  medium: C.mediumMaxSpread,
                  dry: C.dry,
                  wet: C.wet,
                  gap: C.amountGap,
                })}
              </p>
            </div>
          </Section>

          <Section id="climate" title={t.sections.climate}>
            <div className="max-w-prose space-y-3 text-muted-foreground">
              <p>
                {t.climate.intro(NORMALS_PERIOD.start.slice(0, 4), NORMALS_PERIOD.end.slice(0, 4))}
              </p>
              <p>{t.climate.normal}</p>
            </div>
          </Section>

          <Section id="privacy" title={t.sections.privacy}>
            <ul className="max-w-prose list-disc space-y-2 pl-5 text-muted-foreground">
              {t.privacy.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section id="limits" title={t.sections.limits}>
            <ul className="max-w-prose list-disc space-y-2 pl-5 text-muted-foreground">
              {t.limits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section id="credits" title={t.sections.credits}>
            <p className="max-w-prose text-muted-foreground">
              {t.credits(<Source href="https://open-meteo.com/">Open-Meteo.com</Source>)}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
