"use client";

import { IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { OPEN_SEARCH_EVENT } from "@/components/search/search-command";

export function OpenSearchButton({
  label = "Search for a place",
  variant = "default",
  size = "default",
}: {
  label?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
    >
      <IconSearch aria-hidden="true" />
      {label}
    </Button>
  );
}
