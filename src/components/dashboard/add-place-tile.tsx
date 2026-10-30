"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { PANEL } from "@/components/place/tile";
import { OPEN_SEARCH_EVENT } from "@/components/search/search-command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * How to follow another place, from where you compare them. One primary action (search, which is the
 * same palette as the header and the sidebar's "+", so there is a single way in) and a quiet link to
 * the map for people who would rather find a place by where it is. It closes the grid when there is
 * room, and stands alone when home is the only place followed.
 */
export function AddPlaceTile({
  description = "Search any city, or find it on the map. It joins this dashboard and your sidebar.",
}: {
  description?: string;
}) {
  return (
    <div
      className={cn(
        PANEL,
        "flex h-full flex-col justify-between gap-4 border border-dashed bg-transparent dark:bg-transparent",
      )}
    >
      <div>
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
        >
          <Plus className="size-4" />
        </span>
        <h3 className="mt-3 font-heading text-xl">Follow Another Place</h3>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          type="button"
          size="sm"
          onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
        >
          Add a Place
        </Button>
        <Link
          href="/map"
          className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
        >
          or pick it on the map
        </Link>
      </div>
    </div>
  );
}
