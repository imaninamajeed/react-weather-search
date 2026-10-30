"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The two lists on the Locations page: the home location on its own, and the other locations you
 * have saved. The cards are server-rendered and arrive as props; this only switches between them,
 * with the one button that adds a location at the end of the tab row.
 */
export function PlacesTabs({
  homeLabel,
  savedLabel,
  savedCount,
  action,
  home,
  saved,
}: {
  homeLabel: string;
  savedLabel: string;
  savedCount: number;
  action: ReactNode;
  home: ReactNode;
  saved: ReactNode;
}) {
  return (
    <Tabs defaultValue="home" className="gap-4 fit:gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="home">{homeLabel}</TabsTrigger>
          <TabsTrigger value="saved">
            {savedLabel}
            <span className="tnum text-muted-foreground">{savedCount}</span>
          </TabsTrigger>
        </TabsList>
        {action}
      </div>
      <TabsContent value="home">{home}</TabsContent>
      <TabsContent value="saved">{saved}</TabsContent>
    </Tabs>
  );
}
