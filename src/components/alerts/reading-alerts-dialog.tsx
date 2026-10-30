"use client";

import { ChartLine, CircleHelp, OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function LegendRow({
  icon,
  term,
  children,
}: {
  icon: ReactNode;
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {icon}
      </span>
      <div>
        <dt className="font-medium">{term}</dt>
        <dd className="text-muted-foreground">{children}</dd>
      </div>
    </div>
  );
}

/** What the alert labels mean, kept out of sight until asked for: a tab-like button that opens a dialog. */
export function ReadingAlertsDialog({ className }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("rounded-full", className)}>
          <CircleHelp aria-hidden="true" />
          Reading Alerts
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Reading Alerts</DialogTitle>
          <DialogDescription>What the labels on each alert mean.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-4">
          <LegendRow
            term="Warning"
            icon={
              <span className="grid size-6 place-items-center rounded-full bg-warning text-warning-foreground">
                <OctagonAlert className="size-3.5" />
              </span>
            }
          >
            Serious or damaging conditions.
          </LegendRow>
          <LegendRow
            term="Advisory"
            icon={
              <span className="grid size-6 place-items-center rounded-full bg-advisory text-advisory-foreground">
                <TriangleAlert className="size-3.5" />
              </span>
            }
          >
            Worth planning around.
          </LegendRow>
          <LegendRow
            term="Official"
            icon={<ShieldCheck className="size-6 p-1 text-(--brand-teal-text)" />}
          >
            Issued by a national weather service.
          </LegendRow>
          <LegendRow
            term="Forecast Signal"
            icon={<ChartLine className="size-6 p-1 text-muted-foreground" />}
          >
            Our own check of the forecast against set thresholds.
          </LegendRow>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
