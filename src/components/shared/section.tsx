import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id: string;
  title: string;
  /** Right-aligned content in the header row (controls, a short note). */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A hairline-ruled page section with a serif heading. */
export function Section({ id, title, aside, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("border-t border-border pt-6", className)}
    >
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id={`${id}-title`} className="font-heading text-3xl leading-none">
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
