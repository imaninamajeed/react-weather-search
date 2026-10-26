"use client";

import { ArrowDown, ArrowUp, House, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { movePlace, removePlace, restorePlace, setHome } from "@/app/actions";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Button } from "@/components/ui/button";

interface CardControlsProps {
  placeKey: string;
  placeName: string;
  isHome: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/** Reorder, set-home and remove for one saved place (manage mode). */
export function CardControls({ placeKey, placeName, isHome, isFirst, isLast }: CardControlsProps) {
  const [pending, startTransition] = useTransition();
  // Reordering and removing change the saved list on the server, so they need a connection.
  const online = useOnlineStatus();
  const busy = pending || !online;

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error ?? "Something went wrong.");
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removePlace(placeKey);
      if (!result.ok) return void toast.error(result.error);
      toast(`Removed ${placeName}`, {
        action: {
          label: "Undo",
          onClick: () => void restorePlace(placeKey, result.index, result.wasHome),
        },
      });
    });
  }

  return (
    <div className="relative z-10 mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${placeName} up`}
        disabled={busy || isFirst}
        onClick={() => run(() => movePlace(placeKey, "up"))}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${placeName} down`}
        disabled={busy || isLast}
        onClick={() => run(() => movePlace(placeKey, "down"))}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
      {!isHome && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => run(() => setHome(placeKey))}
        >
          <House aria-hidden="true" />
          Set as home
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto text-muted-foreground hover:text-destructive"
        disabled={busy}
        onClick={remove}
      >
        <X aria-hidden="true" />
        Remove
      </Button>
    </div>
  );
}
