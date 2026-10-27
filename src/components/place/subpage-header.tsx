import { formatPlaceSubtitle } from "@/lib/format";
import type { Place } from "@/lib/places";

/** The heading block shared by a place's sub-pages (outlook, climate): what this view is, and for where. */
export function SubpageHeader({
  label,
  place,
  lead,
}: {
  label: string;
  place: Place;
  lead: string;
}) {
  return (
    <header>
      <p className="label-caps">{label}</p>
      <h1 className="mt-2 font-heading text-5xl leading-[0.95] md:text-6xl">{place.name}</h1>
      <p className="mt-2 text-muted-foreground">{formatPlaceSubtitle(place)}</p>
      <p className="mt-4 max-w-prose text-lg text-balance">{lead}</p>
    </header>
  );
}
