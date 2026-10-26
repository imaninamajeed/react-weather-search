"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPEN_SEARCH_EVENT } from "@/components/search/search-command";

export function OpenSearchButton() {
  return (
    <Button onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}>
      <Search aria-hidden="true" />
      Search for a place
    </Button>
  );
}
