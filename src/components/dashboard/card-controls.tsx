"use client";

import { IconArrowDown, IconArrowUp, IconGripVertical, IconHome, IconX } from "@tabler/icons-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { movePlace, removePlace, restorePlace, setHome } from "@/app/actions";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";

interface CardControlsProps {
  placeKey: string;
  placeName: string;
  isHome: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/** Reorder, set-home and remove for one saved location (manage mode). */
export function CardControls({ placeKey, placeName, isHome, isFirst, isLast }: CardControlsProps) {
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
    <div className="relative z-10 mt-4 flex flex-wrap items-center gap-1 border-t border-border/60 pt-3">
      {/* The grip for touch and pen (a mouse can grab the whole card); a keyboard uses the arrows. */}
      {!(isFirst && isLast) && (
        <span
          data-drag-handle
          aria-hidden="true"
          title={t.dashboard.controls.dragToReorder}
          className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <IconGripVertical className="size-4" />
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t.dashboard.controls.moveUp(placeName)}
        disabled={busy || isFirst}
        onClick={() => run(() => movePlace(placeKey, "up"))}
      >
        <IconArrowUp aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t.dashboard.controls.moveDown(placeName)}
        disabled={busy || isLast}
        onClick={() => run(() => movePlace(placeKey, "down"))}
      >
        <IconArrowDown aria-hidden="true" />
      </Button>
      {!isHome && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => run(() => setHome(placeKey), t.dashboard.controls.nowHome(placeName))}
        >
          <IconHome aria-hidden="true" />
          {t.dashboard.controls.setAsHome}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto text-muted-foreground hover:text-destructive"
        disabled={busy}
        onClick={remove}
      >
        <IconX aria-hidden="true" />
        {t.common.remove}
      </Button>
    </div>
  );
}
