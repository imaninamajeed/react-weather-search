"use client";

import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DESTINATIONS, destinationLabel } from "@/components/layout/main-nav-client";
import { useMessages } from "@/lib/i18n/client";

const HINTS = { "/dashboard": "dashboard", "/places": "places", "/map": "map" } as const;

/** With nothing to read here, offers the other pages in a dialog instead of leaving a dead end. */
export function AlertsNextDialog() {
  const t = useMessages();
  const text = t.alerts.next;
  const others = DESTINATIONS.filter((destination) => destination.href !== "/alerts");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-background/70 backdrop-blur dark:bg-white/10">
          <Compass aria-hidden="true" />
          {text.button}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {others.map((destination) => (
            <li key={destination.href}>
              <DialogClose asChild>
                <Link
                  href={destination.href}
                  className="group flex items-center gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-muted focus-visible:bg-muted"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-(--brand-teal-text) [&_svg]:size-5">
                    {destination.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{destinationLabel(destination, t)}</span>
                    <span className="block text-muted-foreground">
                      {text[HINTS[destination.href as keyof typeof HINTS]]}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </DialogClose>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
