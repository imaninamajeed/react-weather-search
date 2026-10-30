"use client";

import { catchError, type ErrorInfo } from "next/error";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";

function Fallback({ title }: { title: string }, { retry }: ErrorInfo) {
  const t = useMessages();
  return (
    <div
      role="alert"
      className="flex h-full min-h-28 flex-col items-start justify-center gap-3 rounded-lg border border-dashed border-border p-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <IconAlertTriangle aria-hidden="true" className="size-4 text-muted-foreground" />
        {t.common.unavailable(title)}
      </div>
      <p className="text-sm text-muted-foreground">{t.common.providerDidntRespond}</p>
      <Button variant="outline" size="sm" onClick={() => retry()}>
        {t.common.tryAgain}
      </Button>
    </div>
  );
}

/**
 * Isolates one section's failure so a single upstream outage degrades a card, not the page.
 * Built on catchError so notFound()/redirect() thrown inside still reach Next.js.
 */
export const SectionBoundary = catchError(Fallback);
