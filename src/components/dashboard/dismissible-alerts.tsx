"use client";

import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DISMISSED_COOKIE, DISMISSED_DAYS } from "@/lib/alerts/dismissed";

const write = (value: string, days: number) => {
  document.cookie = `${DISMISSED_COOKIE}=${value}; path=/; max-age=${days * 86400}; samesite=lax`;
};

/**
 * Puts a close button on the alerts banner. Closing remembers which alerts you have seen (the
 * server then leaves the banner out) and offers an Undo; a new or changed alert brings it back.
 * The banner needs right padding for the button.
 */
export function DismissibleAlerts({
  signature,
  children,
}: {
  signature: string;
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div className="relative">
      {children}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss these alerts"
        title="Dismiss until something changes"
        className="absolute top-1/2 right-2 -translate-y-1/2"
        onClick={() => {
          write(signature, DISMISSED_DAYS);
          setHidden(true);
          toast("Alerts dismissed", {
            description: "They come back if something changes. You can still see them on Alerts.",
            action: {
              label: "Undo",
              onClick: () => {
                write("", 0);
                setHidden(false);
              },
            },
          });
        }}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
