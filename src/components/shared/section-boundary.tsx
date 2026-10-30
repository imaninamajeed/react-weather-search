"use client";

import { catchError, type ErrorInfo } from "next/error";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

function Fallback({ title }: { title: string }, { retry }: ErrorInfo) {
  return (
    <div
      role="alert"
      className="flex h-full min-h-28 flex-col items-start justify-center gap-3 rounded-lg border border-dashed border-border p-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <IconAlertTriangle aria-hidden="true" className="size-4 text-muted-foreground" />
        {title} is unavailable
      </div>
      <p className="text-sm text-muted-foreground">
        The data provider didn&apos;t respond. The rest of the page is unaffected.
      </p>
      <Button variant="outline" size="sm" onClick={() => retry()}>
        Try Again
      </Button>
    </div>
  );
}

/**
 * Isolates one section's failure so a single upstream outage degrades a card, not the page.
 * Built on catchError so notFound()/redirect() thrown inside still reach Next.js.
 */
export const SectionBoundary = catchError(Fallback);
