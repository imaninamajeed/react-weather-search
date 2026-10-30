"use client";

import { useRef, useState, type ComponentProps } from "react";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A card body that may scroll inside a fixed-height page. It is a tab stop only while it really
 * overflows, so a keyboard user can scroll it with the arrow keys and nothing else gains a stop.
 */
export function ScrollBody({ className, ...props }: ComponentProps<typeof CardContent>) {
  const [scrolls, setScrolls] = useState(false);
  const observer = useRef<ResizeObserver | null>(null);

  // A ref callback keeps the observer tied to the element; ResizeObserver reports once on observe.
  const attach = (element: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!element) return;
    const check = () => setScrolls(element.scrollHeight > element.clientHeight + 1);
    observer.current = new ResizeObserver(check);
    observer.current.observe(element);
    for (const child of element.children) observer.current.observe(child);
  };

  return (
    <CardContent
      ref={attach}
      tabIndex={scrolls ? 0 : undefined}
      className={cn("focus-visible:-outline-offset-2", className)}
      {...props}
    />
  );
}
