"use client";

import type { ReactNode } from "react";

/**
 * Ties the cards and the outlook rows of one place together: pointing at or focusing anything
 * marked `data-place-key` lights up everything in here with the same key (`data-linked`), so you
 * can read across from a place's conditions to its week. It sets attributes on the DOM directly,
 * so hovering never re-renders the server-rendered cards.
 */
export function LinkedPlaces({ className, children }: { className?: string; children: ReactNode }) {
  function link(root: HTMLElement, key: string | null) {
    for (const element of root.querySelectorAll<HTMLElement>("[data-place-key]")) {
      element.toggleAttribute("data-linked", key !== null && element.dataset.placeKey === key);
    }
  }

  function keyOf(target: EventTarget) {
    return (
      (target as HTMLElement).closest<HTMLElement>("[data-place-key]")?.dataset.placeKey ?? null
    );
  }

  return (
    <div
      className={className}
      onPointerOver={(event) => {
        if (event.pointerType === "mouse") link(event.currentTarget, keyOf(event.target));
      }}
      onPointerLeave={(event) => link(event.currentTarget, null)}
      onFocus={(event) => link(event.currentTarget, keyOf(event.target))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) link(event.currentTarget, null);
      }}
    >
      {children}
    </div>
  );
}
