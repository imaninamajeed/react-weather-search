"use client";

import { IconDeviceDesktop, IconDownload, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useOptimistic, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { setUnits } from "@/app/actions";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isUnits } from "@/lib/units";
import type { Units } from "@/lib/weather/types";

const groupClass = "rounded-3xl border border-input";
// Joined segments with a filled selection; the px override matches the group's own px-3 selector.
const itemClass =
  "group-data-[spacing=0]/toggle-group:px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary";

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
      size="sm"
      spacing={0}
      className={groupClass}
      value={shown ?? ""}
      onValueChange={change}
      disabled={units === null || !online || pending}
    >
      <ToggleGroupItem value="metric" aria-label="Metric (°C, km/h)" className={itemClass}>
        °C
      </ToggleGroupItem>
      <ToggleGroupItem value="imperial" aria-label="Imperial (°F, mph)" className={itemClass}>
        °F
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** System, light or dark. The saved theme is only known in the browser, so nothing is selected until then. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  return (
    <ToggleGroup
      type="single"
      aria-label="Theme"
      size="sm"
      spacing={0}
      className={groupClass}
      value={mounted ? (theme ?? "system") : ""}
      onValueChange={(value) => value && setTheme(value)}
    >
      <ToggleGroupItem value="system" aria-label="System theme" className={itemClass}>
        <IconDeviceDesktop aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="light" aria-label="Light theme" className={itemClass}>
        <IconSun aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark theme" className={itemClass}>
        <IconMoon aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
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
    <Button variant="outline" size="sm" className="shrink-0" onClick={() => void install()}>
      <IconDownload aria-hidden="true" />
      <span className="hidden xl:inline">Install app</span>
      <span className="sr-only xl:hidden">Install app</span>
    </Button>
  );
}
