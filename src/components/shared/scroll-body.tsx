"use client";

import { useRef, type ComponentProps } from "react";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A card body that may scroll inside a fixed-height page. It is a tab stop only while it really
 * overflows, so a keyboard user can scroll it with the arrow keys and nothing else gains a stop.
 *
 * The tab stop is set on the element itself, in the same callback that measures it, rather than
 * through React state: a render scheduled in between would leave a scrollable region unreachable
 * for a moment, which is exactly when an accessibility scan (or a fast keyboard user) looks.
 */
export function ScrollBody({ className, ...props }: ComponentProps<typeof CardContent>) {
  const cleanup = useRef<(() => void) | null>(null);

  // A ref callback keeps the observers tied to the element. Content can stream in after the card
  // has its size (a list replacing its fallback), which resizes nothing, so changes are watched too.
  const attach = (element: HTMLDivElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!element) return;

    const check = () => {
      if (element.scrollHeight > element.clientHeight + 1) element.setAttribute("tabindex", "0");
      else element.removeAttribute("tabindex");
    };
    check();

    const resize = new ResizeObserver(check);
    resize.observe(element);
    for (const child of element.children) resize.observe(child);
    const mutation = new MutationObserver(() => {
      for (const child of element.children) resize.observe(child);
      check();
    });
    mutation.observe(element, { childList: true, subtree: true });
    cleanup.current = () => {
      resize.disconnect();
      mutation.disconnect();
    };
  };

  return (
    <CardContent
      ref={attach}
      className={cn("focus-visible:-outline-offset-2", className)}
      {...props}
    />
  );
}
