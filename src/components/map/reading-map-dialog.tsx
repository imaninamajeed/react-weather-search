"use client";

import { CircleHelp, CloudRain, MousePointerClick, Play, ZoomIn } from "lucide-react";
import { LegendRow } from "@/components/shared/legend-row";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** A marker pill as the map draws it, small enough to sit beside a legend entry. */
function Pill({ children, home }: { children: string; home?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center rounded-full border bg-card px-2 py-0.5 text-[0.6875rem] font-semibold text-card-foreground shadow-sm",
        home ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      {children}
    </span>
  );
}

/** What the radar's colours, markers and controls mean, kept out of sight until asked for. */
export function ReadingMapDialog({ className }: { className?: string }) {
  const t = useMessages();
  const text = t.map.reading;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("rounded-full", className)}>
          <CircleHelp aria-hidden="true" />
          {text.title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-4">
          <LegendRow
            term={text.rainTerm}
            icon={
              <span className="grid size-6 place-items-center">
                <span className="h-2.5 w-6 rounded-full bg-linear-to-r from-sky-200 via-blue-500 to-indigo-900" />
              </span>
            }
          >
            {text.rain}
          </LegendRow>
          <LegendRow
            term={text.timelineTerm}
            icon={<Play className="size-6 p-1 text-(--brand-teal-text)" />}
          >
            {text.timeline}
          </LegendRow>
          <LegendRow term={text.homeTerm} icon={<Pill home>24°</Pill>}>
            {text.home}
          </LegendRow>
          <LegendRow term={text.savedTerm} icon={<Pill>26°</Pill>}>
            {text.saved}
          </LegendRow>
          <LegendRow
            term={text.clickTerm}
            icon={<MousePointerClick className="size-6 p-1 text-muted-foreground" />}
          >
            {text.click}
          </LegendRow>
          <LegendRow
            term={text.zoomTerm}
            icon={<ZoomIn className="size-6 p-1 text-muted-foreground" />}
          >
            {text.zoom}
          </LegendRow>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
