import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardProps {
  id: string;
  title: string;
  description?: ReactNode;
  /** Top-right of the card header (a link or control). */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A page section as a shadcn card, named by its heading, as the dashboard's cards are. */
export function SectionCard({
  id,
  title,
  description,
  aside,
  className,
  children,
}: SectionCardProps) {
  return (
    <section aria-labelledby={`${id}-title`} className={className}>
      <Card className="h-full">
        <CardHeader className="max-sm:grid-cols-1!">
          <CardTitle id={`${id}-title`} role="heading" aria-level={2} className="text-xl">
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          {aside && (
            <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:mt-2 max-sm:justify-self-start">
              {aside}
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </section>
  );
}
