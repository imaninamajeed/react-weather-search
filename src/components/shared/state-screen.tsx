import type { Icon } from "@tabler/icons-react";
import type { ReactNode } from "react";

/**
 * The one layout for a page that has nothing to show (not found, offline, an error): what happened,
 * in a sentence, and the next steps as buttons, so none of them is a dead end.
 */
export function StateScreen({
  icon: StateIcon,
  label,
  title,
  actions,
  children,
}: {
  icon: Icon;
  label: string;
  title: string;
  /** Buttons, most useful first. */
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-(--page-max) flex-1 flex-col items-start justify-center gap-4 px-4 py-24"
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_oklch,var(--brand-magenta)_12%,transparent)] text-[color-mix(in_oklch,var(--brand-magenta)_75%,var(--foreground))]"
      >
        <StateIcon className="size-6" />
      </span>
      <p className="label-caps">{label}</p>
      <h1 className="font-heading text-5xl md:text-6xl">{title}</h1>
      <div className="max-w-prose text-muted-foreground">{children}</div>
      <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
    </main>
  );
}
