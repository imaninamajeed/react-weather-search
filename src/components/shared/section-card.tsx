import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  id: string;
  title: string;
  description?: ReactNode;
  /** Top-right of the card header (a link or control). */
  aside?: ReactNode;
  className?: string;
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
  children,
}: SectionCardProps) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("fit:min-h-0", className)}>
      <Card className="h-full fit:[--card-spacing:--spacing(4)]">
        <CardHeader className="max-sm:grid-cols-1!">
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
        <CardContent
          className={cn("space-y-4 fit:min-h-0 fit:flex-1 fit:overflow-y-auto", bodyClassName)}
        >
          {children}
        </CardContent>
      </Card>
    </section>
  );
}
