import { Clock, MapPin, OctagonAlert, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { PANEL } from "@/components/place/tile";
import { Badge } from "@/components/ui/badge";
import { describeAlert } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";
import type { Units } from "@/lib/weather/types";

interface AlertTileProps {
  alert: WeatherAlert;
  units: Units;
  /** The place's current local time, to phrase "until…" and "today/tomorrow" correctly. */
  now: string;
  place: { name: string; href: string };
}

/**
 * One alert as a tile on the same inset surface as the count beside it, so the panel reads as a row of
 * equal pieces. Top to bottom: how serious (a small tinted icon and the word), who says so (a badge
 * that tells an official warning from our own forecast signal), what it is, where and when, and any
 * detail. Colour stays in the icon; severity is also the word, never colour alone. An official
 * warning keeps its full notice one click away at the foot of the tile.
 */
export function AlertTile({ alert, units, now, place }: AlertTileProps) {
  const description = describeAlert(alert, units, now);
  const isWarning = alert.severity === "warning";
  const official = alert.source !== "forecast";
  const Icon = isWarning ? OctagonAlert : TriangleAlert;

  return (
    <li className={cn(PANEL, "flex flex-col gap-3")}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full",
              isWarning
                ? "bg-warning/10 text-warning"
                : "bg-advisory/20 text-advisory-foreground dark:text-advisory",
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="label-caps">{isWarning ? "Warning" : "Advisory"}</span>
        </span>
        <Badge variant="outline">
          {official ? `Official · ${alert.issuer}` : "Forecast Signal"}
        </Badge>
      </div>

      <p className="text-lg leading-snug font-medium">{description.title}</p>

      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
          <Link
            href={place.href}
            className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {place.name}
          </Link>
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          {description.when}
        </p>
      </div>

      {description.detail && <p className="text-sm">{description.detail}</p>}

      {alert.source !== "forecast" && (
        <details className="mt-auto border-t border-border pt-3 text-sm">
          <summary className="cursor-pointer font-medium select-none">Full notice</summary>
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
