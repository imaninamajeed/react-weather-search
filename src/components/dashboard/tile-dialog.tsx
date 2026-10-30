"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * A square tile that opens its place's seven days in a dialog instead of leaving the page. The tile
 * face and the details are server-rendered and arrive as props. The tile is a button that a mouse
 * can still drag (`data-tile`, see SortablePlaces): the click that ends a drag opens nothing.
 */
export function TileDialog({
  label,
  title,
  description,
  face,
  now,
  details,
  footer,
}: {
  /** Names the tile for assistive tech: it opens the details. */
  label: string;
  title: string;
  description: string;
  face: ReactNode;
  /** A line above the days: the conditions now. */
  now: ReactNode;
  details: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          data-tile
          aria-label={label}
          className="relative flex size-full flex-col justify-between rounded-4xl bg-card p-4 text-left text-card-foreground shadow-md ring-1 ring-foreground/5 transition-shadow outline-none hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring/50 dark:ring-foreground/10"
        >
          {face}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {now}
        {details}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
