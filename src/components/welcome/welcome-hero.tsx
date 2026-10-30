import {
  IconAlertTriangle,
  IconArrowRight,
  IconChartLine,
  IconRadar,
  IconTemperature,
  type Icon,
} from "@tabler/icons-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { OpenSearchButton } from "@/components/dashboard/open-search-button";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroPreview, legible } from "./hero-preview";
import { SynopticChart } from "./synoptic-chart";

// The four features, in the order and colours of the social image, each linking to where it lives.
const FEATURES: { label: string; tone: string; icon: Icon; text: string; href: string }[] = [
  {
    label: "Alerts",
    tone: "var(--advisory)",
    icon: IconAlertTriangle,
    text: "Official warnings and ours",
    href: "/alerts",
  },
  {
    label: "Confidence",
    tone: "var(--brand-violet)",
    icon: IconChartLine,
    text: "Do the models agree?",
    href: "/about#confidence",
  },
  {
    label: "Climate",
    tone: "var(--brand-teal-text)",
    icon: IconTemperature,
    text: "Is this week unusual?",
    href: "/about#climate",
  },
  {
    label: "Radar",
    tone: "var(--brand-magenta)",
    icon: IconRadar,
    text: "Rain, last two hours",
    href: "/map",
  },
];

/**
 * The whole welcome page, full-bleed and outside the app shell, after the social image: the wordmark,
 * the promise and the four features (a 2×2 of cards) on the left; the storm and a few of the
 * app's cards on the right. Dark mode uses the mark's own ink and light mode the page's white; `--hero-bg` is that
 * surface, which the chart's label gaps and the shade behind the text also use.
 */
export function WelcomeHero() {
  return (
    <section
      aria-labelledby="welcome-title"
      className="relative isolate flex flex-1 flex-col justify-center overflow-hidden bg-(--hero-bg) text-foreground [--hero-bg:var(--background)] dark:[--hero-bg:var(--brand-ink)]"
    >
      {/* Below lg the storm sits behind the cards, which stack under the text. */}
      <SynopticChart className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-136 w-full mask-[linear-gradient(to_bottom,transparent,black_35%)] lg:inset-y-0 lg:h-full lg:mask-none" />
      {/* Keeps the text on a near-plain surface, as the social image does. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 max-lg:hidden"
        style={{
          backgroundImage:
            "radial-gradient(65% 85% at 25% 55%, color-mix(in oklch, var(--hero-bg) 85%, transparent) 45%, transparent 100%)",
        }}
      />

      <div className="grid gap-12 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center lg:gap-8 lg:px-20 lg:py-14">
        <div>
          <div className="group/brand flex items-center gap-4 sm:gap-5">
            <IsobarMark
              animated
              className="size-14 shrink-0 rounded-[22.6%] sm:size-20"
              style={{
                boxShadow:
                  "0 14px 40px -8px color-mix(in oklch, var(--brand-magenta) 55%, transparent), -10px -6px 40px -10px color-mix(in oklch, var(--brand-teal) 50%, transparent)",
              }}
            />
            <h1
              id="welcome-title"
              className="bg-linear-to-b from-foreground from-30% to-foreground/75 bg-clip-text font-heading text-6xl leading-none font-semibold tracking-[-0.035em] text-transparent sm:text-8xl"
            >
              <span className="sr-only">Welcome to </span>Isobar
            </h1>
          </div>

          <p className="mt-6 text-2xl leading-tight font-light text-balance text-foreground/85 sm:mt-8 sm:text-4xl">
            Forecasts, alerts, and <br className="max-sm:hidden" />
            <span
              className="bg-linear-to-r from-(--brand-teal-text) via-(--welcome-violet) via-55% to-(--welcome-magenta) bg-clip-text font-medium text-transparent"
              style={
                {
                  "--welcome-violet": legible("var(--brand-violet)"),
                  "--welcome-magenta": legible("var(--brand-magenta)"),
                } as CSSProperties
              }
            >
              how far to trust them.
            </span>
          </p>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Weather for the locations you follow. There&apos;s no account: your locations stay on
            this device.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <OpenSearchButton label="Find Your City" />
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Open the Dashboard
                <IconArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ul aria-label="Features" className="mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
            {FEATURES.map(({ label, tone, icon: FeatureIcon, text, href }) => (
              <li key={label} className="flex">
                <Link
                  href={href}
                  style={{ "--tone": tone } as CSSProperties}
                  className="group/feature flex w-full rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card
                    size="sm"
                    className="w-full flex-row items-center gap-3 bg-card/70 px-(--card-spacing) backdrop-blur-md transition-all group-hover/feature:-translate-y-0.5 group-hover/feature:ring-(--tone)/60 motion-reduce:transition-none"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_oklch,var(--tone)_16%,transparent)] text-[color-mix(in_oklch,var(--tone)_80%,var(--foreground))] shadow-[0_0_24px_-6px_var(--tone)]"
                    >
                      <FeatureIcon className="size-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-heading text-base leading-tight font-medium">
                        {label}
                        <IconArrowRight
                          aria-hidden="true"
                          className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition group-hover/feature:translate-x-0 group-hover/feature:opacity-100 group-focus-visible/feature:translate-x-0 group-focus-visible/feature:opacity-100"
                        />
                      </span>
                      <span className="mt-0.5 block text-sm text-balance text-muted-foreground">
                        {text}
                      </span>
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <HeroPreview className="mx-auto lg:mr-0" />
      </div>
    </section>
  );
}
