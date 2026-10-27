"use client";

import { IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { OPEN_SEARCH_EVENT } from "@/components/search/search-command";

export function OpenSearchButton() {
  return (
    <Button onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}>
      <IconSearch aria-hidden="true" />
      Search for a place
    </Button>
  );
}
