"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { OPEN_SEARCH_EVENT } from "@/components/search/search-command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * How to follow another place, as a slim row under the places rather than a tile among them: it has
 * nothing to compare, so it should not take a tile's height. One primary action (search, the same
 * palette as the header and the sidebar's "+", so there is a single way in) and a quiet link to the
 * map for people who would rather find a place by where it is. It stands alone when home is the only
 * place followed.
 */
export function AddPlaceTile({
  description = "Search any city and it joins this dashboard and your sidebar.",
  className,
}: {
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl border border-dashed border-border px-4 py-3",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
      >
        <Plus className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium">Follow another location.</span>{" "}
        <span className="text-muted-foreground">{description}</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          type="button"
          size="sm"
          onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
        >
          Add a Location
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
