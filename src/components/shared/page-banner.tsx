import type { ReactNode } from "react";
import { SkyPanel } from "@/components/shared/sky-panel";
import { skyPreset, type SkyPalette } from "@/lib/weather/sky";

/**
 * The banner that opens a top-level page (Alerts, Locations, Map), painted with a sky that sets the
 * page's mood: the Alerts page's follows what is active (a storm for warnings, rain for advisories,
 * a clear day when all is quiet), the others are fixed. A label, a headline and a line of lead on the
 * left, with room under them for the page's own controls (`children`), and something on the right
 * (`aside`: figures, or an illustration). On a phone it is deliberately short (smaller headline and
 * figures), because the page's content, not its banner, should fill the first screen. The sky is
 * mood, never the message: the words and counts always say what it means.
 */
export function PageBanner({
  id,
  label,
  title,
  lead,
  palette,
  aside,
  children,
}: {
  /** Names the banner's headline for assistive tech; unique on the page. */
  id: string;
  label: string;
  title: string;
  lead: string;
  /** The sky behind it (see lib/weather/sky.ts). */
  palette: SkyPalette;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <SkyPanel as="section" scene={skyPreset(palette)} aria-labelledby={`${id}-title`}>
      <div className="grid gap-5 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <p className="label-caps">{label}</p>
          <h2
            id={`${id}-title`}
            className="mt-2 font-heading text-4xl leading-[0.95] text-balance sm:mt-3 sm:text-6xl lg:text-7xl"
          >
            {title}
          </h2>
          <p className="mt-3 max-w-prose text-base text-muted-foreground sm:mt-4 sm:text-lg">
            {lead}
          </p>
          {children}
        </div>
        {aside}
      </div>
    </SkyPanel>
  );
}

/** Big numbers for a banner's right side, split by hairlines. */
export function BannerFigures({ figures }: { figures: { label: string; value: ReactNode }[] }) {
  return (
    <dl
      className="grid divide-x divide-border border-t border-border pt-4 sm:pt-6 lg:border-t-0 lg:pt-0"
      style={{ gridTemplateColumns: `repeat(${figures.length}, auto)` }}
    >
      {figures.map(({ label, value }) => (
        <div key={label} className="px-6 first:pl-0 last:pr-0 lg:px-10 lg:first:pl-0 lg:last:pr-0">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="tnum mt-1 font-heading text-4xl leading-none font-medium sm:text-6xl">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
