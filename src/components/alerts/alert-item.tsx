import { OctagonAlert, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { describeAlert } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import type { Units } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

const captionClass = "font-heading text-[0.6875rem] tracking-[0.08em] uppercase";

interface AlertItemProps {
  alert: WeatherAlert;
  units: Units;
  /** The place's current local time, to phrase "until…" and "today/tomorrow" correctly. */
  now: string;
  /** Names the place when alerts from several places are listed together. */
  place?: { name: string; href: string };
}

/**
 * Severity is carried by icon + word + colour, never colour alone. Official warnings are
 * visibly distinct from our own forecast signals so nobody mistakes one for the other.
 */
export function AlertItem({ alert, units, now, place }: AlertItemProps) {
  const description = describeAlert(alert, units, now);
  const isWarning = alert.severity === "warning";
  const Icon = isWarning ? OctagonAlert : TriangleAlert;
  const official = alert.source !== "forecast";

  return (
    <li
      className={cn(
        "rounded-lg border border-l-4 border-border p-4",
        isWarning ? "border-l-warning bg-warning/5" : "border-l-advisory bg-advisory/10",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Icon aria-hidden="true" className="size-4" />
        <span className={cn(captionClass, "font-semibold")}>
          {isWarning ? "Warning" : "Advisory"}
        </span>
        <span className={cn(captionClass, "text-muted-foreground")}>
          · {official ? `Official · ${alert.issuer}` : "Forecast Signal"}
        </span>
        {place && (
          <Link
            href={place.href}
            className="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {place.name}
          </Link>
        )}
      </div>

      <p className="mt-1.5 text-lg font-medium">{description.title}</p>
      <p className="text-sm text-muted-foreground">{description.when}</p>
      {description.detail && <p className="mt-1 text-sm">{description.detail}</p>}

      {alert.source !== "forecast" && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium select-none">Full Notice</summary>
          {alert.summary && <p className="mt-2 font-medium">{alert.summary}</p>}
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{alert.text}</p>
          {alert.instruction && <p className="mt-2 whitespace-pre-line">{alert.instruction}</p>}
          <a
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Source: {alert.issuer}
          </a>
        </details>
      )}
    </li>
  );
}
