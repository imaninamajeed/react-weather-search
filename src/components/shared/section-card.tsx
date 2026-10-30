import type { ReactNode } from "react";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollBody } from "./scroll-body";

interface SectionCardProps {
  id: string;
  title: string;
  description?: ReactNode;
  /** Top-right of the card header (a link or control). */
  aside?: ReactNode;
  className?: string;
  /** Keep the title for assistive tech only where space is short (the content explains itself). */
  quietTitleAtFit?: boolean;
  /** Classes for the card body, e.g. to let a chart fill it. */
  bodyClassName?: string;
  children: ReactNode;
}

/** A page section as a shadcn card, named by its heading, as the dashboard's cards are. */
export function SectionCard({
  id,
  title,
  description,
  aside,
  className,
  bodyClassName,
  quietTitleAtFit,
  children,
}: SectionCardProps) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("", className)}>
      <Card className="h-full fit:[--card-spacing:--spacing(4)]">
        <CardHeader className={cn("max-sm:grid-cols-1!", quietTitleAtFit && "fit:sr-only")}>
          <CardTitle id={`${id}-title`} role="heading" aria-level={2} className="text-xl">
            {title}
          </CardTitle>
          {description && <CardDescription className="fit:hidden">{description}</CardDescription>}
          {aside && (
            <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:mt-2 max-sm:justify-self-start">
              {aside}
            </CardAction>
          )}
        </CardHeader>
        <ScrollBody className={cn("space-y-4", bodyClassName)}>{children}</ScrollBody>
      </Card>
    </section>
  );
}
