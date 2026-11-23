"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * A square tile that shows its place's seven days where it stands: the face is a button, and the
 * list fades in over it while the pointer is on the tile (the whole `group/row` wrapper, so reaching
 * for its menu keeps it open) or the keyboard is on it. A finger has no hover, so a tap pins the
 * list open and a back button unpins it. The face and the list are server-rendered and arrive as
 * props. The face is a button that a mouse can still drag (`data-tile`, see SortablePlaces).
 * Must sit inside a `group/row`.
 */
export function TileFlip({
  label,
  title,
  href,
  caption,
  face,
  details,
  footer,
  draggable = true,
}: {
  /** Names the face for assistive tech: it shows the details. */
  label: string;
  title: string;
  /** Where the title goes: the full forecast, which a dense tile has no room for a link to. */
  href: string;
  /** Under the title: what the list is ("7-day outlook"). */
  caption: string;
  face: ReactNode;
  details: ReactNode;
  footer: ReactNode;
  /** Whether the tile can be picked up (a lone tile has nothing to reorder against): shows the grab cursor. */
  draggable?: boolean;
}) {
  const t = useMessages();
  const [pinned, setPinned] = useState(false);
  const pointer = useRef("mouse");

  return (
    <div className="@container relative size-full">
      <button
        type="button"
        data-tile
        aria-label={label}
        aria-expanded={pinned}
        onPointerDown={(event) => (pointer.current = event.pointerType)}
        // A mouse hovers its way in; only a finger or pen taps the list open.
        onClick={() => pointer.current !== "mouse" && setPinned(true)}
        className={cn(
          "relative flex size-full flex-col justify-between overflow-hidden rounded-4xl bg-card p-4 text-left text-card-foreground shadow-md ring-1 ring-foreground/5 transition-shadow outline-none hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring/50 dark:ring-foreground/10",
          draggable && "cursor-grab",
        )}
      >
        {face}
      </button>

      <div
        role="group"
        aria-label={title}
        className={cn(
          draggable && "cursor-grab",
          "absolute inset-0 flex flex-col overflow-hidden rounded-4xl bg-card p-3 text-card-foreground shadow-lg ring-1 ring-foreground/5 transition-[opacity,visibility] duration-150 @min-[18rem]:p-4 dark:ring-foreground/10",
          // Hidden means out of the tab order too, so only a visible list can be tabbed into.
          pinned
            ? "visible opacity-100"
            : "invisible opacity-0 group-has-[:focus-visible]/row:visible group-has-[:focus-visible]/row:opacity-100 [@media(hover:hover)]:group-hover/row:visible [@media(hover:hover)]:group-hover/row:opacity-100",
        )}
      >
        {/* The tile's menu sits over the top right corner, so the title leaves room for it. */}
        <div className="flex items-center gap-2 pr-9">
          <button
            type="button"
            aria-label={t.dashboard.week.back}
            onClick={() => setPinned(false)}
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [@media(hover:hover)]:hidden"
          >
            <IconArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate font-heading text-lg leading-tight">
              <Link
                href={href}
                className="cursor-pointer underline decoration-transparent decoration-2 underline-offset-4 transition-colors outline-none hover:decoration-(--brand-teal-text) focus-visible:decoration-(--brand-teal-text)"
              >
                {title}
              </Link>
            </p>
            <p className="label-caps @max-[18rem]:hidden">{caption}</p>
          </div>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{details}</div>
        <div className="pt-2 @max-[18rem]:hidden">{footer}</div>
      </div>
    </div>
  );
}
