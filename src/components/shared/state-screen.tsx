import type { ReactNode } from "react";

/**
 * The one layout for a page that has nothing to show (not found, offline, an error): a small
 * illustration of what happened, the words for it, and the next steps as buttons, so none of them is
 * a dead end. The art sits above the words on a phone and beside them from md up.
 */
export function StateScreen({
  art,
  label,
  title,
  actions,
  children,
}: {
  /** A spot illustration from shared/illustrations.tsx. */
  art: ReactNode;
  label: string;
  title: string;
  /** Buttons, most useful first. */
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-(--page-max) flex-1 flex-col items-start justify-center gap-6 px-4 py-20 md:flex-row md:items-center md:gap-12"
    >
      <div className="shrink-0 [&>svg]:h-32 md:[&>svg]:h-44">{art}</div>
      <div className="flex flex-col items-start gap-4">
        <p className="label-caps">{label}</p>
        <h1 className="font-heading text-5xl md:text-6xl">{title}</h1>
        <div className="max-w-prose text-muted-foreground">{children}</div>
        <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
      </div>
    </main>
  );
}
