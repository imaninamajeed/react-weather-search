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
      <h1 className="mt-2 font-heading text-5xl leading-[0.95] md:text-6xl fit:mt-1 fit:text-4xl">
        {place.name}
      </h1>
      <div className="fit:mt-1 fit:flex fit:flex-wrap fit:items-baseline fit:gap-x-4">
        <p className="mt-2 text-muted-foreground fit:mt-0">{formatPlaceSubtitle(place)}</p>
        <p className="mt-4 max-w-prose text-lg text-balance fit:mt-0 fit:text-base">{lead}</p>
      </div>
    </header>
  );
}
