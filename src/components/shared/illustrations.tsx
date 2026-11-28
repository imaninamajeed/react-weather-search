import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Cloud, Moon, Sun } from "./weather-glyphs";

/*
 * Spot illustrations for the moments with nothing to show: no saved places, no alerts, offline, not
 * found, an error. Built from the weather glyphs' parts (weather-glyphs.tsx) on a soft disc, so they
 * match the icons and follow the theme through tokens. Decorative: the words beside them carry the
 * meaning.
 */

function Art({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 128"
      aria-hidden="true"
      focusable="false"
      className={cn("h-28 w-auto shrink-0", className)}
    >
      <ellipse cx="80" cy="66" rx="62" ry="58" fill="var(--muted)" />
      <ellipse cx="80" cy="118" rx="44" ry="5" fill="var(--foreground)" opacity="0.06" />
      {children}
    </svg>
  );
}

/** A map pin in the primary colour. Tip at (x, y). */
function Pin({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 0C-4 -10 -16 -20 -16 -32a16 16 0 0 1 32 0C16 -20 4 -10 0 0Z"
        fill="var(--primary)"
      />
      <circle cx="0" cy="-32" r="6.5" fill="var(--primary-foreground)" />
    </g>
  );
}

/** Nothing saved yet: a pin waiting under a sun that peeks from a cloud. */
export function NoPlacesArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      <svg x="78" y="10" width="64" height="64" viewBox="0 0 64 64" overflow="visible">
        <Sun cx={24} cy={23} r={11} />
        <Cloud x={14} y={28} scale={0.95} />
      </svg>
      <Pin x={60} y={112} scale={1.25} />
    </Art>
  );
}

/** No alerts: a clear sky with a small cloud drifting by. */
export function AllClearArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      <svg x="34" y="14" width="96" height="96" viewBox="0 0 64 64" overflow="visible">
        <Sun cx={30} cy={30} r={15} />
        <Cloud x={30} y={38} scale={0.62} />
      </svg>
    </Art>
  );
}

/** Offline: a cloud with its signal broken. */
export function OfflineArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      <svg x="28" y="22" width="104" height="104" viewBox="0 0 64 64" overflow="visible">
        <Cloud x={8} y={14} />
      </svg>
      <g
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="5"
        strokeLinecap="round"
        transform="translate(80 30)"
      >
        <path d="M-22 0a31 31 0 0 1 44 0" strokeDasharray="12 9" />
        <path d="M-12 10a17 17 0 0 1 24 0" />
        <circle cx="0" cy="20" r="1.5" fill="var(--muted-foreground)" />
      </g>
    </Art>
  );
}

/** Not found: a pin lost in fog, under a faint moon. */
export function NotFoundArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      <svg x="94" y="10" width="44" height="44" viewBox="0 0 64 64" overflow="visible">
        <Moon cx={32} cy={33} r={20} />
      </svg>
      <Pin x={80} y={92} scale={1.2} />
      <g stroke="var(--icon-fog)" strokeWidth="6" strokeLinecap="round" opacity="0.9">
        <line x1="34" y1="84" x2="96" y2="84" />
        <line x1="62" y1="97" x2="128" y2="97" />
        <line x1="44" y1="110" x2="104" y2="110" />
      </g>
    </Art>
  );
}

/** Something went wrong: a storm cloud. */
export function ErrorArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      <svg x="28" y="16" width="104" height="104" viewBox="0 0 64 64" overflow="visible">
        <path
          d="M35 40 25 54h7l-4 10 13-16h-7l4-8Z"
          fill="var(--icon-bolt)"
          stroke="var(--icon-sun-shade)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <Cloud x={10} y={8} tone="dark" />
      </svg>
    </Art>
  );
}
