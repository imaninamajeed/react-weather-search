"use client";

import {
  IconCircleDashed,
  IconClick,
  IconCrosshair,
  IconHelpCircle,
  IconHome,
  IconMapPin,
  IconPlayerPlay,
  IconZoomIn,
} from "@tabler/icons-react";
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

/** A pin as the map draws it, small enough to sit beside a legend entry. */
function Pill({ children, home }: { children: string; home?: boolean }) {
  const Icon = home ? IconHome : IconMapPin;
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full border bg-card py-0.5 pr-2 pl-0.5 font-heading text-xs font-medium text-card-foreground shadow-sm",
        home ? "border-primary" : "border-border",
      )}
    >
      <span
        className={cn(
          "grid size-4 place-items-center rounded-full",
          home ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-2.5" />
      </span>
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
          <IconHelpCircle aria-hidden="true" />
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
          <LegendRow term={text.homeTerm} icon={<Pill home>Subang Jaya</Pill>}>
            {text.home}
          </LegendRow>
          <LegendRow term={text.savedTerm} icon={<Pill>Tokyo</Pill>}>
            {text.saved}
          </LegendRow>
          <LegendRow
            term={text.areaTerm}
            icon={<IconCircleDashed className="size-6 p-1 text-icon-rain" />}
          >
            {text.area}
          </LegendRow>
          <LegendRow
            term={text.timelineTerm}
            icon={<IconPlayerPlay className="size-6 p-1 text-primary" />}
          >
            {text.timeline}
          </LegendRow>
          <LegendRow
            term={text.centerTerm}
            icon={<IconCrosshair className="size-6 p-1 text-muted-foreground" />}
          >
            {text.center}
          </LegendRow>
          <LegendRow
            term={text.clickTerm}
            icon={<IconClick className="size-6 p-1 text-muted-foreground" />}
          >
            {text.click}
          </LegendRow>
          <LegendRow
            term={text.zoomTerm}
            icon={<IconZoomIn className="size-6 p-1 text-muted-foreground" />}
          >
            {text.zoom}
          </LegendRow>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
