"use client";

import { IconBookmark, IconBookmarkFilled, IconHome, IconRadar } from "@tabler/icons-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { removePlace, restorePlace, savePlace, setHome } from "@/app/actions";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";

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
  const t = useMessages();
  const offlineHint = online ? undefined : t.place.actions.needsConnection;

  function toggleSaved() {
    startTransition(async () => {
      if (saved) {
        const result = await removePlace(placeKey);
        if (!result.ok) return void toast.error(result.error);
        toast(t.dashboard.controls.removed(placeName), {
          action: {
            label: t.common.undo,
            onClick: () => void restorePlace(placeKey, result.index, result.wasHome),
          },
        });
      } else {
        const result = await savePlace(placeKey);
        if (!result.ok) return void toast.error(result.error);
        toast.success(t.place.actions.saved(placeName), {
          action: { label: t.common.undo, onClick: () => void removePlace(placeKey) },
        });
      }
    });
  }

  function makeHome() {
    startTransition(async () => {
      const result = await setHome(placeKey);
      if (!result.ok) return void toast.error(result.error);
      toast.success(t.dashboard.controls.nowHome(placeName));
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button asChild variant="ghost" size="sm" className={onInk}>
        <Link
          href={`/map?place=${encodeURIComponent(placeKey)}`}
          aria-label={t.dashboard.hero.radarFor(placeName)}
        >
          <IconRadar aria-hidden="true" />
          {t.dashboard.hero.radar}
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
        {saved ? t.place.actions.savedState : t.place.actions.save}
      </Button>
      {isHome ? (
        <span className="inline-flex h-7 items-center gap-1 px-2 text-[0.8rem] text-muted-foreground dark:text-white/80">
          <IconHome aria-hidden="true" className="size-3.5" />
          {t.dashboard.hero.home}
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
          {t.dashboard.controls.setAsHome}
        </Button>
      )}
    </div>
  );
}
