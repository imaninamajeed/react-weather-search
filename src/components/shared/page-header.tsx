import type { ReactNode } from "react";
import { SkyPanel } from "@/components/shared/sky-panel";
import { cn } from "@/lib/utils";
import { skyPreset, type SkyPalette } from "@/lib/weather/sky";

/**
 * The heading block shared by the app's top-level pages: what this is, a title, and one line of
 * purpose. With `sky` it sits on a slim panel of that sky (see SkyPanel), for pages without weather
 * of their own to show.
 */
export function PageHeader({
  label,
  title,
  lead,
  aside,
  sky,
}: {
  /** Text for the visitor, or <Text id="…"/> where the page is prerendered. */
  label: ReactNode;
  title: ReactNode;
  lead: ReactNode;
  /** A primary action for the page, aligned to the right of the title. */
  aside?: ReactNode;
  sky?: SkyPalette;
}) {
  const content = (
    <>
      <div>
        <p className="label-caps fit:sr-only">{label}</p>
        <h1 className="mt-2 font-heading text-5xl leading-[0.95] md:text-6xl fit:mt-0 fit:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground fit:mt-1 fit:max-w-none fit:text-sm">
          {lead}
        </p>
      </div>
      {aside}
    </>
  );
  const layout = "flex flex-wrap items-end justify-between gap-x-6 gap-y-4 fit:items-center";
  return sky ? (
    <SkyPanel
      as="header"
      scene={skyPreset(sky)}
      className={cn(layout, "p-6 sm:p-8 fit:px-6 fit:py-4")}
    >
      {content}
    </SkyPanel>
  ) : (
    <header className={layout}>{content}</header>
  );
}
