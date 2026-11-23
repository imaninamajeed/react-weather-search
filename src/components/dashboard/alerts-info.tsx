"use client";

import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * What the alerts were checked against, and anything that could not be checked, behind a small button
 * so the alerts row stays one line tall. It turns into a warning icon when a check failed, because
 * "no alerts" from a feed that was down is not an all-clear and should not hide in a popover.
 */
export function AlertsInfo({ warn, children }: { warn: boolean; children: ReactNode }) {
  const t = useMessages().dashboard.overview;
  const StatusIcon = warn ? TriangleAlert : Info;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={warn ? t.whatWasCheckedFailed : t.whatWasChecked}
        >
          <StatusIcon
            aria-hidden="true"
            className={warn ? "text-warning" : "text-muted-foreground"}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-2 text-xs">
        {children}
      </PopoverContent>
    </Popover>
  );
}
