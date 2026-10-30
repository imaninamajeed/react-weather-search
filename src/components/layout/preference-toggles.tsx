"use client";

import {
  IconDeviceDesktop,
  IconDownload,
  IconLanguage,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useOptimistic, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { setLanguage, setUnits } from "@/app/actions";
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
import { announceLocale, useLocale, useMessages } from "@/lib/i18n/client";
import { LOCALES, LOCALE_NAMES, isLocale } from "@/lib/i18n/locales";
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
  const t = useMessages();

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
      aria-label={t.nav.units}
      variant="outline"
      spacing={0}
      value={shown ?? ""}
      onValueChange={change}
      disabled={units === null || !online || pending}
    >
      <ToggleGroupItem value="metric" aria-label={t.nav.metric}>
        °C
      </ToggleGroupItem>
      <ToggleGroupItem value="imperial" aria-label={t.nav.imperial}>
        °F
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** System, light or dark, as shadcn's mode toggle: one button, a menu of three. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useMessages();
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
        <Button variant="outline" size="icon" aria-label={t.nav.theme}>
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
            {t.nav.light}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <IconMoon aria-hidden="true" />
            {t.nav.dark}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <IconDeviceDesktop aria-hidden="true" />
            {t.nav.system}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The interface language, as a menu in the style of the theme toggle. The choice is saved in a cookie on
 * the server (so the parts that stream in are rendered in it too), which needs a connection.
 */
export function LanguageToggle() {
  const locale = useLocale();
  const t = useMessages();
  const online = useOnlineStatus();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(locale);

  function change(value: string) {
    if (!isLocale(value) || value === locale) return;
    startTransition(async () => {
      setShown(value);
      const result = await setLanguage(value);
      if (!result.ok) return void toast.error(result.error);
      announceLocale();
    });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t.nav.language}
          disabled={!online || pending}
        >
          <IconLanguage aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={shown} onValueChange={change}>
          {LOCALES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {LOCALE_NAMES[code]}
            </DropdownMenuRadioItem>
          ))}
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
  const t = useMessages();
  if (!install) return null;
  return (
    <Button variant="outline" className="shrink-0 max-sm:hidden" onClick={() => void install()}>
      <IconDownload aria-hidden="true" />
      <span className="hidden xl:inline">{t.nav.installApp}</span>
      <span className="sr-only xl:hidden">{t.nav.installApp}</span>
    </Button>
  );
}
