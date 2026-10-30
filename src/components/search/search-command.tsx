"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconClock,
  IconCurrentLocation,
  IconHome,
  IconLayoutDashboard,
  IconListDetails,
  IconMap,
  IconMapPin,
  IconMoon,
  IconSearch,
  IconSun,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { formatPlaceSubtitle } from "@/lib/format";
import { useMessages } from "@/lib/i18n/client";
import { normalizeQuery, MIN_QUERY_LENGTH } from "@/lib/open-meteo/geocoding-query";
import { coordinateKey, placeHref, type Place } from "@/lib/places";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { usePalettePlaces } from "./palette-places";
import { useRecentSearches } from "./use-recent-searches";

const DEBOUNCE_MS = 250;

/** Dispatch on `window` to open the dialog from elsewhere (e.g. the dashboard's empty state). */
export const OPEN_SEARCH_EVENT = "isobar:open-search";

/** The pages the palette can jump to, so ⌘K is a way around the whole app and not only to a city. */
const DESTINATIONS = [
  { href: "/dashboard", label: "dashboard", icon: IconLayoutDashboard },
  { href: "/alerts", label: "alerts", icon: IconAlertTriangle },
  { href: "/places", label: "locations", icon: IconListDetails },
  { href: "/map", label: "radarMap", icon: IconMap },
] as const;

/**
 * The button that opens the palette. Any number of these can sit in the page (the sidebar's, the
 * phone header's); the one palette they open lives in the layout.
 */
export function SearchTrigger() {
  const t = useMessages();
  return (
    <Button
      variant="outline"
      className="size-9 justify-center gap-0 px-0 text-muted-foreground sm:w-full sm:justify-start sm:gap-2 sm:px-2.5"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      aria-label={t.search.trigger}
      aria-keyshortcuts="Control+K Meta+K /"
    >
      <IconSearch aria-hidden="true" className="size-4" />
      <span className="hidden flex-1 text-left font-normal sm:inline">{t.search.trigger}</span>
      <kbd className="hidden rounded border border-border px-1.5 font-heading text-[0.6875rem] sm:inline">
        /
      </kbd>
    </Button>
  );
}
interface SearchResult {
  /** The query these places answer. */
  query: string;
  /** null = the request failed. */
  places: Place[] | null;
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

interface SearchCommandProps {
  /** The places you follow, home first: offered before anything is typed. */
  places?: Place[];
  homeKey?: string;
  /** Render the trigger button too. Off when the layout supplies its own triggers. */
  trigger?: boolean;
}

export function SearchCommand({
  places: placesProp,
  homeKey: homeKeyProp,
  trigger = true,
}: SearchCommandProps) {
  const t = useMessages();
  const fromStore = usePalettePlaces();
  const followed = placesProp ?? fromStore.places;
  const homeKey = homeKeyProp ?? fromStore.homeKey;
  const router = useRouter();
  const { recents, add } = useRecentSearches();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<SearchResult>({ query: "", places: [] });
  const [notice, setNotice] = useState("");
  const online = useOnlineStatus();

  const { resolvedTheme, setTheme } = useTheme();

  // Read through a ref so the key listener (registered once) always flips from the current theme.
  const toggleThemeRef = useRef(() => {});
  useEffect(() => {
    toggleThemeRef.current = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const query = normalizeQuery(input);
  const searchable = query.length >= MIN_QUERY_LENGTH;
  // Typing "theme", "dark" etc. also surfaces the command, since there is no filtering to find it.
  const showTheme = !searchable || new RegExp(t.search.themeWords, "i").test(query);
  const destinations = searchable
    ? DESTINATIONS.filter((destination) =>
        t.nav[destination.label].toLowerCase().includes(query.toLowerCase()),
      )
    : DESTINATIONS;

  // ⌘K / Ctrl+K anywhere, or "/" when not typing in a field. "D" flips the theme under the same rule.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash = event.key === "/" && !isEditable(event.target);
      const isTheme =
        event.key.toLowerCase() === "d" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.repeat &&
        !isEditable(event.target);
      if (isShortcut || isSlash) {
        event.preventDefault();
        setOpen(true);
      } else if (isTheme) {
        event.preventDefault();
        toggleThemeRef.current();
      }
    }
    const openFromEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, openFromEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, openFromEvent);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Stale requests are aborted so an older, slower response can never overwrite a newer one.
  useEffect(() => {
    if (debounced.length < MIN_QUERY_LENGTH || !online) return;
    const controller = new AbortController();
    fetch(`/api/places/search?q=${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        return response.json() as Promise<{ places: Place[] }>;
      })
      .then(({ places }) => setResult({ query: debounced, places }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({ query: debounced, places: null });
      });
    return () => controller.abort();
  }, [debounced, online]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setInput("");
      setDebounced("");
      setNotice("");
    }
  }

  function go(place: Place) {
    add(place);
    handleOpenChange(false);
    router.push(placeHref(place));
  }

  // Places you already follow aren't "searches", so they stay out of the recents.
  function openFollowed(place: Place) {
    handleOpenChange(false);
    router.push(placeHref(place));
  }

  function visit(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setNotice(t.search.status.noGeolocation);
      return;
    }
    setNotice(t.search.status.finding);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        handleOpenChange(false);
        router.push(placeHref({ key: coordinateKey(coords.latitude, coords.longitude) }));
      },
      () => setNotice(t.search.status.couldntLocate),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }

  const settled = searchable && debounced === query && result.query === query;
  const loading = searchable && !settled;
  const failed = settled && result.places === null;
  const places = settled ? (result.places ?? []) : [];

  let status = notice;
  if (!status && searchable && !online) {
    status = t.search.status.offline;
  } else if (!status && searchable) {
    if (loading) status = t.search.status.searching;
    else if (failed) status = t.search.status.unavailable;
    else if (places.length === 0) status = t.search.status.noMatch(query);
    else status = t.search.status.found(places.length);
  }

  return (
    <>
      {trigger && <SearchTrigger />}

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={t.search.trigger}
        description={t.search.description}
      >
        {/* Results come from the server, so cmdk's own filtering is turned off. */}
        <Command shouldFilter={false}>
          <CommandInput value={input} onValueChange={setInput} placeholder={t.search.placeholder} />
          {/* Outside the listbox: a listbox may only contain options and groups. */}
          <p
            role="status"
            className={status ? "px-3 py-3 text-sm text-muted-foreground" : "sr-only"}
          >
            {status}
          </p>
          <CommandList>
            {places.length > 0 && (
              <CommandGroup heading={t.search.groups.locations}>
                {places.map((place) => (
                  <PlaceItem key={place.key} place={place} icon={IconMapPin} onSelect={go} />
                ))}
              </CommandGroup>
            )}

            {!searchable && followed.length > 0 && (
              <CommandGroup heading={t.nav.yourLocations}>
                {followed.map((place) => (
                  <PlaceItem
                    key={place.key}
                    place={place}
                    icon={place.key === homeKey ? IconHome : IconMapPin}
                    onSelect={openFollowed}
                  />
                ))}
              </CommandGroup>
            )}

            {!searchable && recents.length > 0 && (
              <CommandGroup heading={t.search.groups.recent}>
                {recents.map((place) => (
                  <PlaceItem key={place.key} place={place} icon={IconClock} onSelect={go} />
                ))}
              </CommandGroup>
            )}

            {!searchable && (
              <CommandGroup heading={t.search.groups.nearby}>
                <CommandItem value="my-location" onSelect={locate}>
                  <IconCurrentLocation aria-hidden="true" />
                  {t.search.useMyLocation}
                </CommandItem>
              </CommandGroup>
            )}

            {destinations.length > 0 && (
              <CommandGroup heading={t.search.groups.goTo}>
                {destinations.map(({ href, label, icon: Icon }) => (
                  <CommandItem key={href} value={`go-${href}`} onSelect={() => visit(href)}>
                    <Icon aria-hidden="true" />
                    {t.nav[label]}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showTheme && (
              <CommandGroup heading={t.search.groups.appearance}>
                <CommandItem
                  value="toggle-theme"
                  onSelect={() => {
                    toggleThemeRef.current();
                    handleOpenChange(false);
                  }}
                >
                  {resolvedTheme === "dark" ? (
                    <IconSun aria-hidden="true" />
                  ) : (
                    <IconMoon aria-hidden="true" />
                  )}
                  {resolvedTheme === "dark" ? t.search.switchToLight : t.search.switchToDark}
                  <CommandShortcut aria-hidden="true">D</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function PlaceItem({
  place,
  icon: Icon,
  onSelect,
}: {
  place: Place;
  icon: typeof IconMapPin;
  onSelect: (place: Place) => void;
}) {
  return (
    <CommandItem value={place.key} onSelect={() => onSelect(place)}>
      <Icon aria-hidden="true" />
      <span className="font-medium">{place.name}</span>
      <span className="truncate text-muted-foreground">{formatPlaceSubtitle(place)}</span>
    </CommandItem>
  );
}
