"use client";

import { IconAdjustmentsHorizontal, IconDownload } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { toast } from "sonner";
import { setUnits } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const online = useOnlineStatus();
  // Always mounted, so it catches the browser's one-shot install event early.
  const install = useInstallPrompt();

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
          <IconAdjustmentsHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Units</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={units} onValueChange={changeUnits}>
          <DropdownMenuRadioItem value="metric" disabled={!online}>
            Metric (°C, km/h)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="imperial" disabled={!online}>
            Imperial (°F, mph)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {install && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void install()}>
              <IconDownload aria-hidden="true" />
              Install app
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
