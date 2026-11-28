"use client";

import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconChartLine,
  IconHelpCircle,
  IconShieldCheck,
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

/** What the alert labels mean, kept out of sight until asked for: a tab-like button that opens a dialog. */
export function ReadingAlertsDialog({ className }: { className?: string }) {
  const t = useMessages();
  const text = t.alerts.reading;
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
            term={t.common.warning}
            icon={
              <span className="grid size-6 place-items-center rounded-full bg-warning text-warning-foreground">
                <IconAlertOctagon className="size-3.5" />
              </span>
            }
          >
            {text.warning}
          </LegendRow>
          <LegendRow
            term={t.common.advisory}
            icon={
              <span className="grid size-6 place-items-center rounded-full bg-advisory text-advisory-foreground">
                <IconAlertTriangle className="size-3.5" />
              </span>
            }
          >
            {text.advisory}
          </LegendRow>
          <LegendRow
            term={text.officialTerm}
            icon={<IconShieldCheck className="size-6 p-1 text-primary" />}
          >
            {text.official}
          </LegendRow>
          <LegendRow
            term={t.alerts.item.forecastSignal}
            icon={<IconChartLine className="size-6 p-1 text-muted-foreground" />}
          >
            {text.forecastSignal}
          </LegendRow>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
