"use client";

import { Bookmark, BookmarkCheck, House } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { removePlace, restorePlace, savePlace, setHome } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface PlaceActionsProps {
  placeKey: string;
  placeName: string;
  saved: boolean;
  isHome: boolean;
}

/** Save / set-home controls in the hero. Every change can be undone from its toast. */
export function PlaceActions({ placeKey, placeName, saved, isHome }: PlaceActionsProps) {
  const [pending, startTransition] = useTransition();

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
    <div className="flex shrink-0 items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        aria-pressed={saved}
        disabled={pending}
        onClick={toggleSaved}
      >
        {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
        {saved ? "Saved" : "Save"}
      </Button>
      {isHome ? (
        <span className="inline-flex h-7 items-center gap-1 px-2 text-[0.8rem] text-muted-foreground">
          <House aria-hidden="true" className="size-3.5" />
          Home
        </span>
      ) : (
        <Button variant="ghost" size="sm" disabled={pending} onClick={makeHome}>
          <House aria-hidden="true" />
          Set as home
        </Button>
      )}
    </div>
  );
}
