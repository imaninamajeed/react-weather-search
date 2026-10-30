"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The two lists on the Locations page: the home location on its own, and the other locations you
 * have saved. The cards are server-rendered and arrive as props; this only switches between them.
 * At the end of the tab row sit the one button that adds a location and, after it and on the saved
 * tab only, the control for how the saved tiles are laid out. The button stays put when the menu
 * comes and goes.
 */
export function PlacesTabs({
  homeLabel,
  savedLabel,
  savedCount,
  action,
  savedAction,
  home,
  saved,
}: {
  homeLabel: string;
  savedLabel: string;
  savedCount: number;
  action: ReactNode;
  /** After the action, while the saved tab is showing. */
  savedAction: ReactNode;
  home: ReactNode;
  saved: ReactNode;
}) {
  const [tab, setTab] = useState("home");

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4 fit:gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="home">{homeLabel}</TabsTrigger>
          <TabsTrigger value="saved">
            {savedLabel}
            <span className="tnum text-muted-foreground">{savedCount}</span>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {action}
          {tab === "saved" && savedAction}
        </div>
      </div>
      <TabsContent value="home">{home}</TabsContent>
      <TabsContent value="saved">{saved}</TabsContent>
    </Tabs>
  );
}
