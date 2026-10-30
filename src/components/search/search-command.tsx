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
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: IconAlertTriangle },
  { href: "/places", label: "Locations", icon: IconListDetails },
  { href: "/map", label: "Radar Map", icon: IconMap },
];

/**
 * The button that opens the palette. Any number of these can sit in the page (the sidebar's, the
 * phone header's); the one palette they open lives in the layout.
 */
export function SearchTrigger() {
  return (
    <Button
      variant="outline"
      className="size-9 justify-center gap-0 px-0 text-muted-foreground sm:w-full sm:justify-start sm:gap-2 sm:px-2.5"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      aria-label="Search Locations"
      aria-keyshortcuts="Control+K Meta+K /"
    >
      <IconSearch aria-hidden="true" className="size-4" />
      <span className="hidden flex-1 text-left font-normal sm:inline">Search Locations</span>
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
  const showTheme = !searchable || /theme|dark|light|mode|appearance/i.test(query);
  const destinations = searchable
    ? DESTINATIONS.filter((destination) =>
        destination.label.toLowerCase().includes(query.toLowerCase()),
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
      setNotice("Your browser doesn't support location lookup.");
      return;
    }
    setNotice("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        handleOpenChange(false);
        router.push(placeHref({ key: coordinateKey(coords.latitude, coords.longitude) }));
      },
      () => setNotice("Couldn't get your location. Check your browser's location permission."),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }

  const settled = searchable && debounced === query && result.query === query;
  const loading = searchable && !settled;
  const failed = settled && result.places === null;
  const places = settled ? (result.places ?? []) : [];

  let status = notice;
  if (!status && searchable && !online) {
    status = "You're offline. Search needs a connection.";
  } else if (!status && searchable) {
    if (loading) status = "Searching…";
    else if (failed) status = "Search is unavailable right now. Try again in a moment.";
    else if (places.length === 0) status = `No locations match “${query}”.`;
    else status = `${places.length} ${places.length === 1 ? "location" : "locations"} found.`;
  }

  return (
    <>
      {trigger && <SearchTrigger />}

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search Locations"
        description="Search for a city, then press Enter to open its forecast."
      >
        {/* Results come from the server, so cmdk's own filtering is turned off. */}
        <Command shouldFilter={false}>
          <CommandInput value={input} onValueChange={setInput} placeholder="Search a city…" />
          {/* Outside the listbox: a listbox may only contain options and groups. */}
          <p
            role="status"
            className={status ? "px-3 py-3 text-sm text-muted-foreground" : "sr-only"}
          >
            {status}
          </p>
          <CommandList>
            {places.length > 0 && (
              <CommandGroup heading="Locations">
                {places.map((place) => (
                  <PlaceItem key={place.key} place={place} icon={IconMapPin} onSelect={go} />
                ))}
              </CommandGroup>
            )}

            {!searchable && followed.length > 0 && (
              <CommandGroup heading="Your Locations">
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
              <CommandGroup heading="Recent">
                {recents.map((place) => (
                  <PlaceItem key={place.key} place={place} icon={IconClock} onSelect={go} />
                ))}
              </CommandGroup>
            )}

            {!searchable && (
              <CommandGroup heading="Nearby">
                <CommandItem value="my-location" onSelect={locate}>
                  <IconCurrentLocation aria-hidden="true" />
                  Use My Location
                </CommandItem>
              </CommandGroup>
            )}

            {destinations.length > 0 && (
              <CommandGroup heading="Go To">
                {destinations.map(({ href, label, icon: Icon }) => (
                  <CommandItem key={href} value={`go-${href}`} onSelect={() => visit(href)}>
                    <Icon aria-hidden="true" />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showTheme && (
              <CommandGroup heading="Appearance">
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
                  Switch to {resolvedTheme === "dark" ? "Light" : "Dark"} Theme
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
