"use client";

import { cn } from "@/lib/utils";
import { useSavedColumns } from "./saved-columns";
import { SortablePlaces, type SortableItem } from "./sortable-places";

/**
 * Spelled out in full so Tailwind finds them. From `lg` up only: below that it is 2 or 3 across, and
 * five across waits for `xl`, where a tile is still wide enough to read without scrolling.
 */
const ACROSS = { 4: "lg:grid-cols-4", 5: "lg:grid-cols-4 xl:grid-cols-5" } as const;

/** The saved locations as a grid of square tiles, as many across as the layout menu says. */
export function SavedGrid({ items }: { items: SortableItem[] }) {
  const [columns] = useSavedColumns();
  return (
    <SortablePlaces
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 fit:gap-3", ACROSS[columns])}
      items={items}
    />
  );
}
