"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { reorderPlaces } from "@/app/actions";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { cn } from "@/lib/utils";

export interface SortableItem {
  key: string;
  name: string;
  /** The server-rendered card. */
  node: ReactNode;
}

/** A drag starts after this many pixels, so a plain click on a card still opens it. */
const DRAG_THRESHOLD = 5;

interface Gesture {
  key: string;
  pointerId: number;
  startX: number;
  startY: number;
  /** Where inside the card it was grabbed, in the list's own coordinates. */
  grabX: number;
  grabY: number;
  viaHandle: boolean;
  started: boolean;
}

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/**
 * The places you follow, as cards you can pick up and drop in a new order, like cards on a board:
 * the one you hold lifts and tilts, a dashed slot shows where it will land, and the others slide
 * out of the way. With a mouse, grab a card anywhere; with touch or a pen, use its grip (the page
 * still scrolls under a finger anywhere else). The arrow buttons on each card do the same with a
 * keyboard. The order is saved as soon as you let go, and put back if saving fails.
 */
export function SortablePlaces({
  items,
  className,
}: {
  items: SortableItem[];
  className?: string;
}) {
  const online = useOnlineStatus();
  const [, startTransition] = useTransition();

  // The saved order is the server's. Ours leads while you drag and until the save comes back; when
  // the server's order changes (an arrow button, a removal), it replaces ours.
  const savedKeys = items.map((item) => item.key);
  const savedSignature = savedKeys.join("|");
  const [order, setOrder] = useState(savedKeys);
  const [seenSignature, setSeenSignature] = useState(savedSignature);
  if (savedSignature !== seenSignature) {
    setSeenSignature(savedSignature);
    setOrder(savedKeys);
  }
  const [drag, setDrag] = useState<{ key: string; x: number; y: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const suppressClick = useRef(false);
  // The window listeners below outlive renders, so they read the latest of these through refs.
  const live = useRef({ order, items, savedSignature, online });
  useLayoutEffect(() => {
    live.current = { order, items, savedSignature, online };
  });

  /** Moves the held card to follow the pointer, measured against its slot in the list. */
  function follow() {
    const held = gesture.current;
    const list = listRef.current;
    const slot = held && itemRefs.current.get(held.key);
    if (!held || !list || !slot) return;
    const box = list.getBoundingClientRect();
    setDrag({
      key: held.key,
      x: pointer.current.x - box.left - held.grabX - slot.offsetLeft,
      y: pointer.current.y - box.top - held.grabY - slot.offsetTop,
    });
  }

  // Cards slide to their new slots (FLIP: start where they were, ease to where they are), and the
  // held card keeps following the pointer when its slot moves under it.
  useLayoutEffect(() => {
    if (gesture.current?.started) follow();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const [key, element] of itemRefs.current) {
      const before = positions.current.get(key);
      const after = { x: element.offsetLeft, y: element.offsetTop };
      positions.current.set(key, after);
      if (!before || still || key === gesture.current?.key) continue;
      const dx = before.x - after.x;
      const dy = before.y - after.y;
      if (dx || dy) {
        element.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], {
          duration: 220,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        });
      }
    }
  }, [order]);

  useEffect(() => {
    const forget = () => positions.current.clear();
    window.addEventListener("resize", forget);
    return () => window.removeEventListener("resize", forget);
  }, []);

  useEffect(() => {
    function finish(commit: boolean) {
      const held = gesture.current;
      gesture.current = null;
      if (!held?.started) return;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      setDrag(null);
      // The click that ends a drag must not open the card it was dropped on.
      setTimeout(() => (suppressClick.current = false), 0);

      const { order, items, savedSignature } = live.current;
      if (!commit || order.join("|") === savedSignature) {
        if (!commit) setOrder(items.map((item) => item.key));
        return;
      }
      const name = items.find((item) => item.key === held.key)?.name ?? "Place";
      startTransition(async () => {
        const result = await reorderPlaces(order);
        if (!result.ok) {
          toast.error(result.error);
          setOrder(items.map((item) => item.key));
          return;
        }
        setAnnouncement(
          `Moved ${name} to position ${order.indexOf(held.key) + 1} of ${order.length}.`,
        );
      });
    }

    function move(event: PointerEvent) {
      const held = gesture.current;
      if (!held || event.pointerId !== held.pointerId) return;
      pointer.current = { x: event.clientX, y: event.clientY };

      if (!held.started) {
        const far = Math.hypot(event.clientX - held.startX, event.clientY - held.startY);
        if (!held.viaHandle && far < DRAG_THRESHOLD) return;
        if (!live.current.online) {
          gesture.current = null;
          toast.error("You're offline. Reconnect to reorder your places.");
          return;
        }
        const list = listRef.current;
        const slot = itemRefs.current.get(held.key);
        if (!list || !slot) return;
        const box = list.getBoundingClientRect();
        held.grabX = held.startX - box.left - slot.offsetLeft;
        held.grabY = held.startY - box.top - slot.offsetTop;
        held.started = true;
        suppressClick.current = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
      }

      follow();

      // Whatever card the pointer is over takes the held card's place in the order.
      const list = listRef.current;
      if (!list) return;
      const box = list.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const over = live.current.order.find((key) => {
        const element = itemRefs.current.get(key);
        return (
          key !== held.key &&
          element &&
          x >= element.offsetLeft &&
          x <= element.offsetLeft + element.offsetWidth &&
          y >= element.offsetTop &&
          y <= element.offsetTop + element.offsetHeight
        );
      });
      if (over) {
        setOrder((current) => arrayMove(current, current.indexOf(held.key), current.indexOf(over)));
      }
    }

    const up = () => finish(true);
    const cancel = () => finish(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  function begin(event: ReactPointerEvent<HTMLUListElement>) {
    if (items.length < 2 || event.button !== 0) return;
    const target = event.target as HTMLElement;
    const slot = target.closest<HTMLElement>("[data-sortable-key]");
    if (!slot) return;
    const viaHandle = target.closest("[data-drag-handle]") !== null;
    // Buttons keep their own clicks; a finger or pen scrolls and taps, and grabs only by the grip.
    if (!viaHandle && (event.pointerType !== "mouse" || target.closest("button, input, select"))) {
      return;
    }
    pointer.current = { x: event.clientX, y: event.clientY };
    gesture.current = {
      key: slot.dataset.sortableKey!,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      grabX: 0,
      grabY: 0,
      viaHandle,
      started: false,
    };
  }

  const byKey = new Map(items.map((item) => [item.key, item]));

  return (
    <>
      <ul
        ref={listRef}
        className={cn("relative", className)}
        onPointerDown={begin}
        // A link would start the browser's own drag-and-drop, which ends our pointer events.
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {order.map((key) => {
          const item = byKey.get(key);
          if (!item) return null;
          const held = drag?.key === key;
          return (
            <li
              key={key}
              data-sortable-key={key}
              ref={(element) => {
                if (element) itemRefs.current.set(key, element);
                else itemRefs.current.delete(key);
              }}
              className={cn(
                "rounded-3xl",
                held && "bg-muted/50 outline-2 -outline-offset-2 outline-border outline-dashed",
              )}
            >
              <div
                className={cn(
                  "h-full rounded-3xl",
                  held
                    ? "relative z-30 cursor-grabbing shadow-2xl motion-safe:scale-[1.03] motion-safe:rotate-1"
                    : "transition-[translate,scale,rotate,box-shadow] duration-200 ease-out",
                )}
                style={held ? { translate: `${drag.x}px ${drag.y}px` } : undefined}
              >
                {item.node}
              </div>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
