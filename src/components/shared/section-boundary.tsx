"use client";

import { catchError, type ErrorInfo } from "next/error";
import { ErrorArt } from "@/components/shared/illustrations";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";

function Fallback({ title }: { title: string }, { retry }: ErrorInfo) {
  const t = useMessages();
  return (
    <div
      role="alert"
      className="flex h-full min-h-28 items-center gap-4 rounded-3xl bg-muted/50 p-4"
    >
      <ErrorArt className="h-16" />
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm font-medium">{t.common.unavailable(title)}</p>
        <p className="text-sm text-muted-foreground">{t.common.providerDidntRespond}</p>
        <Button variant="outline" size="sm" onClick={() => retry()}>
          {t.common.tryAgain}
        </Button>
      </div>
    </div>
  );
}

/**
 * Isolates one section's failure so a single upstream outage degrades a card, not the page.
 * Built on catchError so notFound()/redirect() thrown inside still reach Next.js.
 */
export const SectionBoundary = catchError(Fallback);
