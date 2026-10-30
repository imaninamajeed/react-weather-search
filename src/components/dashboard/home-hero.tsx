import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { PlaceHero } from "@/components/place/hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { placeHref, type Place } from "@/lib/places";
import type { Forecast, Units } from "@/lib/weather/types";

/** The dashboard's opening panel: the shared place hero, marked as home, linking to its full forecast. */
export function HomeHero({
  place,
  forecast,
  units,
}: {
  place: Place;
  forecast: Forecast;
  units: Units;
}) {
  return (
    <PlaceHero
      place={place}
      forecast={forecast}
      units={units}
      headingLevel={2}
      fit
      className="fit:flex-none"
      actions={
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="dark:bg-white/10 dark:text-white">
            Home
          </Badge>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
          >
            <Link href={placeHref(place)}>
              Full forecast
              <IconArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      }
    />
  );
}
