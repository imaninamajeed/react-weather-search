import {
  ChartLine,
  ChevronDown,
  Clock,
  OctagonAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { describeAlert } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import type { Units } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

interface AlertItemProps {
  alert: WeatherAlert;
  units: Units;
  /** The place's current local time, to phrase "until…" and "today/tomorrow" correctly. */
  now: string;
  /** Names the place when alerts from several places are listed together. */
  place?: { name: string; href: string };
}

const dot = (
  <span aria-hidden="true" className="text-border">
    ·
  </span>
);

/**
 * One title and one line of facts: how serious, who says so, and when. Severity is carried by icon +
 * word + colour, never colour alone, in the same tinted treatment as the dashboard's alerts banner.
 * Official warnings are visibly distinct from our own forecast signals (the source in the facts line,
 * and a full notice to open) so nobody mistakes one for the other.
 */
export function AlertItem({ alert, units, now, place }: AlertItemProps) {
  const description = describeAlert(alert, units, now);
  const isWarning = alert.severity === "warning";
  const Icon = isWarning ? OctagonAlert : TriangleAlert;
  const official = alert.source !== "forecast";
  const SourceIcon = official ? ShieldCheck : ChartLine;

  return (
    <li
      className={cn(
        "flex gap-3.5 rounded-3xl p-4 ring-1 sm:p-5",
        isWarning
          ? "bg-warning/10 shadow-[0_0_40px_-18px_var(--warning)] ring-warning/40"
          : "bg-advisory/15 ring-advisory/50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          isWarning ? "bg-warning text-warning-foreground" : "bg-advisory text-advisory-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-heading text-xl leading-tight font-medium">{description.title}</p>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="font-heading text-[0.6875rem] font-semibold tracking-[0.08em] text-foreground uppercase">
            {isWarning ? "Warning" : "Advisory"}
          </span>
          {dot}
          <span className="inline-flex items-center gap-1">
            <SourceIcon aria-hidden="true" className="size-3.5 shrink-0" />
            {official ? `Official · ${alert.issuer}` : "Forecast Signal"}
          </span>
          {dot}
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5 shrink-0" />
            {description.when}
          </span>
          {place && (
            <>
              {dot}
              <Link
                href={place.href}
                className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                {place.name}
              </Link>
            </>
          )}
        </p>

        {description.detail && <p className="mt-2.5">{description.detail}</p>}

        {alert.source !== "forecast" && (
          <details className="group mt-3 text-sm">
            <summary className="inline-flex cursor-pointer items-center gap-1 rounded-full font-medium select-none">
              Full Notice
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="mt-3 space-y-2 rounded-2xl bg-background/60 p-3.5 dark:bg-background/30">
              {alert.summary && <p className="font-medium">{alert.summary}</p>}
              <p className="whitespace-pre-line text-muted-foreground">{alert.text}</p>
              {alert.instruction && <p className="whitespace-pre-line">{alert.instruction}</p>}
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block underline decoration-border underline-offset-4 hover:text-foreground"
              >
                Source: {alert.issuer}
              </a>
            </div>
          </details>
        )}
      </div>
    </li>
  );
}
