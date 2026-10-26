"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { toast } from "sonner";
import { setUnits } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Units } from "@/lib/weather/types";

export function SettingsMenu({ units }: { units: Units }) {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  function changeUnits(value: string) {
    startTransition(async () => {
      const result = await setUnits(value);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Settings" disabled={pending}>
          <SlidersHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Units</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={units} onValueChange={changeUnits}>
          <DropdownMenuRadioItem value="metric">Metric (°C, km/h)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="imperial">Imperial (°F, mph)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
