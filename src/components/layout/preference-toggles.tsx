"use client";

import { IconDeviceDesktop, IconDownload, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useOptimistic, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { setUnits } from "@/app/actions";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isUnits } from "@/lib/units";
import type { Units } from "@/lib/weather/types";

const subscribeNever = () => () => {};

/**
 * Metric or imperial. Switching writes the cookie on the server, so it needs a connection. Null units
 * (still loading from the cookie) shows the toggle disabled with nothing selected.
 */
export function UnitsToggle({ units }: { units: Units | null }) {
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(units);
  const online = useOnlineStatus();

  function change(value: string) {
    // Radix reports "" when the selected segment is pressed again; one option is always on.
    if (!isUnits(value)) return;
    startTransition(async () => {
      setShown(value);
      const result = await setUnits(value);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <ToggleGroup
      type="single"
      aria-label="Units"
      variant="outline"
      spacing={0}
      value={shown ?? ""}
      onValueChange={change}
      disabled={units === null || !online || pending}
    >
      <ToggleGroupItem value="metric" aria-label="Metric (°C, km/h)">
        °C
      </ToggleGroupItem>
      <ToggleGroupItem value="imperial" aria-label="Imperial (°F, mph)">
        °F
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** System, light or dark, as shadcn's mode toggle: one button, a menu of three. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser, so nothing is selected until then.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  return (
    // Non-modal: a small menu shouldn't hide the rest of the page (and its skip link) from assistive
    // tech while open, which is what a modal Radix menu does.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Theme">
          <IconSun aria-hidden="true" className="dark:hidden" />
          <IconMoon aria-hidden="true" className="hidden dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={mounted ? (theme ?? "system") : ""}
          onValueChange={(value) => setTheme(value)}
        >
          <DropdownMenuRadioItem value="light">
            <IconSun aria-hidden="true" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <IconMoon aria-hidden="true" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <IconDeviceDesktop aria-hidden="true" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Only present when the browser can install the app. Always mounted (outside any Suspense), so it
 * catches the browser's one-shot install event early.
 */
export function InstallButton() {
  const install = useInstallPrompt();
  if (!install) return null;
  return (
    <Button variant="outline" className="shrink-0 max-sm:hidden" onClick={() => void install()}>
      <IconDownload aria-hidden="true" />
      <span className="hidden xl:inline">Install App</span>
      <span className="sr-only xl:hidden">Install App</span>
    </Button>
  );
}
