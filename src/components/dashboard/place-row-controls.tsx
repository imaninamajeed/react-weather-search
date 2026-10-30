"use client";

import {
  IconArrowDown,
  IconArrowUp,
  IconDots,
  IconGripVertical,
  IconHome,
  IconX,
} from "@tabler/icons-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { movePlace, removePlace, restorePlace, setHome } from "@/app/actions";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** The grip for touch and pen (a mouse can grab the whole row; a keyboard uses the menu). */
export function DragGrip({ className }: { className?: string }) {
  const t = useMessages();
  return (
    <span
      data-drag-handle
      aria-hidden="true"
      title={t.dashboard.controls.dragToReorder}
      className={cn(
        "grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      <IconGripVertical className="size-4" />
    </span>
  );
}

interface RowMenuProps {
  placeKey: string;
  placeName: string;
  isHome: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Move, set-home and remove for one saved location, behind one "⋯" button. With a pointer it fades
 * in when you reach for the row (hover or focus) so the weather leads; touch has no hover, so
 * there it is always shown.
 */
export function RowMenu({ placeKey, placeName, isHome, isFirst, isLast }: RowMenuProps) {
  const t = useMessages();
  const [pending, startTransition] = useTransition();
  // Reordering and removing change the saved list on the server, so they need a connection.
  const online = useOnlineStatus();
  const busy = pending || !online;

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error ?? t.common.somethingWentWrong);
      else if (success) toast.success(success);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removePlace(placeKey);
      if (!result.ok) return void toast.error(result.error);
      toast(t.dashboard.controls.removed(placeName), {
        action: {
          label: t.common.undo,
          onClick: () => void restorePlace(placeKey, result.index, result.wasHome),
        },
      });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.dashboard.controls.actions(placeName)}
          className="relative z-10 text-muted-foreground transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0"
        >
          <IconDots aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={busy || isFirst}
          onSelect={() => run(() => movePlace(placeKey, "up"))}
        >
          <IconArrowUp aria-hidden="true" />
          {t.dashboard.controls.moveUp(placeName)}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy || isLast}
          onSelect={() => run(() => movePlace(placeKey, "down"))}
        >
          <IconArrowDown aria-hidden="true" />
          {t.dashboard.controls.moveDown(placeName)}
        </DropdownMenuItem>
        {!isHome && (
          <DropdownMenuItem
            disabled={busy}
            onSelect={() => run(() => setHome(placeKey), t.dashboard.controls.nowHome(placeName))}
          >
            <IconHome aria-hidden="true" />
            {t.dashboard.controls.setAsHome}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={busy} onSelect={remove}>
          <IconX aria-hidden="true" />
          {t.common.remove}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
