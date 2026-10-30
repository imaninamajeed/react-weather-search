"use client";

import { IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { OPEN_SEARCH_EVENT } from "@/components/search/search-command";
import { useMessages } from "@/lib/i18n/client";

export function OpenSearchButton({
  label,
  variant = "default",
  size = "default",
}: {
  label?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}) {
  const t = useMessages();
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
    >
      <IconSearch aria-hidden="true" />
      {label ?? t.dashboard.searchLocation}
    </Button>
  );
}
