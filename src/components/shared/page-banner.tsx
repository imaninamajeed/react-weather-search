import type { ReactNode } from "react";
import { IsobarMark } from "@/components/shared/isobar-mark";

// The isobars are bright, so the text on a banner carries a soft halo in the panel's own colour,
// as on the dashboard hero.
const halo = "[text-shadow:0_0_14px_var(--halo),0_0_5px_var(--halo)]";

/**
 * The banner that opens a top-level page (Alerts, Places), drawn like the dashboard's hero: the
 * mark's isobars turn slowly behind it and fade out well before the words. A label, a headline and
 * a line of lead on the left, with room under them for the page's own controls (`children`), and
 * something on the right (`aside`: figures, or a mark). The glows are the brand's, never a status
 * colour, so a banner about warnings is not also a banner full of red.
 */
export function PageBanner({
  id,
  label,
  title,
  lead,
  aside,
  children,
}: {
  /** Names the banner's headline for assistive tech; unique on the page. */
  id: string;
  label: string;
  title: string;
  lead: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="relative isolate overflow-hidden rounded-4xl bg-card text-card-foreground shadow-md ring-1 ring-foreground/5 [--glow-magenta:12%] [--glow-teal:9%] [--halo:oklch(1_0_0/0.95)] dark:bg-black dark:text-white dark:shadow-none dark:ring-0 dark:[--glow-magenta:26%] dark:[--glow-teal:14%] dark:[--halo:#000]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(55% 90% at 100% 0%, color-mix(in oklch, var(--brand-magenta) var(--glow-magenta), transparent), transparent 70%)",
            "radial-gradient(60% 90% at 0% 100%, color-mix(in oklch, var(--brand-teal) var(--glow-teal), transparent), transparent 70%)",
          ].join(", "),
        }}
      />
      <IsobarMark
        bare
        detail="full"
        className="pointer-events-none absolute -top-24 -right-20 -z-10 size-[26rem] mask-[radial-gradient(closest-side,black_35%,transparent)] opacity-40 motion-safe:animate-[spin_240s_linear_infinite] lg:-top-44 lg:-right-16 lg:size-[36rem] dark:opacity-55"
      />

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <p className={`label-caps text-foreground/75 dark:text-white/90 ${halo}`}>{label}</p>
          <h2
            id={`${id}-title`}
            className="mt-3 font-heading text-5xl leading-[0.95] text-balance sm:text-6xl lg:text-7xl"
          >
            {title}
          </h2>
          <p
            className={`mt-4 max-w-prose text-lg text-muted-foreground dark:text-white/80 ${halo}`}
          >
            {lead}
          </p>
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}

/** Big numbers for a banner's right side, split by hairlines. */
export function BannerFigures({ figures }: { figures: { label: string; value: ReactNode }[] }) {
  return (
    <dl
      className="grid divide-x divide-border border-t border-border pt-6 lg:border-t-0 lg:pt-0"
      style={{ gridTemplateColumns: `repeat(${figures.length}, auto)` }}
    >
      {figures.map(({ label, value }) => (
        <div key={label} className="px-6 first:pl-0 last:pr-0 lg:px-10 lg:first:pl-0 lg:last:pr-0">
          <dt className={`text-sm text-muted-foreground dark:text-white/80 ${halo}`}>{label}</dt>
          <dd className="tnum mt-1 font-heading text-6xl leading-none font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
