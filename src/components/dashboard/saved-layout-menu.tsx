"use client";

import { IconChevronDown, IconLayoutGrid } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages } from "@/lib/i18n/client";
import { COLUMN_OPTIONS, useSavedColumns, type Columns } from "./saved-columns";

/**
 * How many saved-location tiles go across (4×4 or 5×5), as a menu beside the Add button. It
 * only matters from `lg` up, where the tiles are in a grid that wide; below that it is hidden.
 */
export function SavedLayoutMenu() {
  const t = useMessages();
  const [columns, setColumns] = useSavedColumns();

  return (
    <div className="hidden lg:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label={`${t.dashboard.view.layout}: ${columns}×${columns}`}
          >
            <IconLayoutGrid aria-hidden="true" />
            {columns}×{columns}
            <IconChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuRadioGroup
            value={String(columns)}
            onValueChange={(value) => setColumns(Number(value) as Columns)}
          >
            {COLUMN_OPTIONS.map((count) => (
              <DropdownMenuRadioItem key={count} value={String(count)}>
                {count}×{count}
                <span className="sr-only"> ({t.dashboard.view.columns(count)})</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
