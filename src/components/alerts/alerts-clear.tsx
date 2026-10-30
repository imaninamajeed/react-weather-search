import { Check, House } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPlaceSubtitle } from "@/lib/format";
import { placeHref, type Place } from "@/lib/places";

/**
 * What the page shows in place of the alert cards when nothing is active: each place that was checked,
 * with a tick, so "all clear" is something you can see was looked into rather than an empty page.
 */
export function AlertsClear({ places, homeKey }: { places: Place[]; homeKey: string }) {
  return (
    <section aria-labelledby="alerts-clear-title">
      <Card>
        <CardHeader className="gap-1">
          <CardTitle id="alerts-clear-title" role="heading" aria-level={2} className="text-2xl">
            Nothing to plan around
          </CardTitle>
          <CardDescription>
            Checked just now. New warnings and forecast signals appear here as they are issued.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3">
            {places.map((place) => (
              <li
                key={place.key}
                className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--brand-teal-text)_14%,transparent)] text-(--brand-teal-text)"
                >
                  <Check className="size-4" />
                </span>
                <div className="min-w-0">
                  <Link
                    href={placeHref(place)}
                    className="block truncate font-medium underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-(--brand-teal-text)"
                  >
                    {place.name}
                  </Link>
                  <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                    {place.key === homeKey && <House aria-hidden="true" className="size-3.5" />}
                    {[place.key === homeKey && "Home", formatPlaceSubtitle(place)]
                      .filter(Boolean)
                      .join(" · ")}
                    <span className="sr-only">, no alerts</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
