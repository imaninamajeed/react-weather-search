"use client";

import { IconBookmark, IconBookmarkFilled, IconHome, IconRadar } from "@tabler/icons-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { removePlace, restorePlace, savePlace, setHome } from "@/app/actions";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PlaceActionsProps {
  placeKey: string;
  placeName: string;
  saved: boolean;
  isHome: boolean;
}

// The hero is the mark's ink in dark mode, so its controls are glass there.
const onInk =
  "dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/15 dark:hover:text-white";

/** Save / set-home controls in the hero. Every change can be undone from its toast. */
export function PlaceActions({ placeKey, placeName, saved, isHome }: PlaceActionsProps) {
  const [pending, startTransition] = useTransition();
  const online = useOnlineStatus();
  const offlineHint = online ? undefined : "Needs a connection";

  function toggleSaved() {
    startTransition(async () => {
      if (saved) {
        const result = await removePlace(placeKey);
        if (!result.ok) return void toast.error(result.error);
        toast(`Removed ${placeName}`, {
          action: {
            label: "Undo",
            onClick: () => void restorePlace(placeKey, result.index, result.wasHome),
          },
        });
      } else {
        const result = await savePlace(placeKey);
        if (!result.ok) return void toast.error(result.error);
        toast.success(`Saved ${placeName}`, {
          action: { label: "Undo", onClick: () => void removePlace(placeKey) },
        });
      }
    });
  }

  function makeHome() {
    startTransition(async () => {
      const result = await setHome(placeKey);
      if (!result.ok) return void toast.error(result.error);
      toast.success(`${placeName} is now your home`);
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button asChild variant="ghost" size="sm" className={onInk}>
        <Link
          href={`/map?place=${encodeURIComponent(placeKey)}`}
          aria-label={`Radar for ${placeName}`}
        >
          <IconRadar aria-hidden="true" />
          Radar
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={onInk}
        aria-pressed={saved}
        disabled={pending || !online}
        title={offlineHint}
        onClick={toggleSaved}
      >
        {saved ? <IconBookmarkFilled aria-hidden="true" /> : <IconBookmark aria-hidden="true" />}
        {saved ? "Saved" : "Save"}
      </Button>
      {isHome ? (
        <span className="inline-flex h-7 items-center gap-1 px-2 text-[0.8rem] text-muted-foreground dark:text-white/80">
          <IconHome aria-hidden="true" className="size-3.5" />
          Home
        </span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className={onInk}
          disabled={pending || !online}
          title={offlineHint}
          onClick={makeHome}
        >
          <IconHome aria-hidden="true" />
          Set as home
        </Button>
      )}
    </div>
  );
}
