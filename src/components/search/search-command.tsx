"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatPlaceSubtitle } from "@/lib/format";
import { normalizeQuery, MIN_QUERY_LENGTH } from "@/lib/open-meteo/geocoding-query";
import { coordinateKey, placeHref, type Place } from "@/lib/places";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { useRecentSearches } from "./use-recent-searches";

const DEBOUNCE_MS = 250;

/** Dispatch on `window` to open the dialog from elsewhere (e.g. the dashboard's empty state). */
export const OPEN_SEARCH_EVENT = "isobar:open-search";

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

export function SearchCommand() {
  const router = useRouter();
  const { recents, add } = useRecentSearches();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<SearchResult>({ query: "", places: [] });
  const [notice, setNotice] = useState("");
  const online = useOnlineStatus();

  const query = normalizeQuery(input);
  const searchable = query.length >= MIN_QUERY_LENGTH;

  // ⌘K / Ctrl+K anywhere, or "/" when not typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash = event.key === "/" && !isEditable(event.target);
      if (isShortcut || isSlash) {
        event.preventDefault();
        setOpen(true);
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
    else if (places.length === 0) status = `No places match “${query}”.`;
    else status = `${places.length} ${places.length === 1 ? "place" : "places"} found.`;
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-full justify-start gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Search places"
        aria-keyshortcuts="Control+K Meta+K /"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="flex-1 text-left font-normal">Search places</span>
        <kbd className="hidden rounded border border-border px-1.5 font-mono text-[0.6875rem] sm:inline">
          /
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search places"
        description="Search for a city, then press Enter to open its forecast."
      >
        {/* Results come from the server, so cmdk's own filtering is turned off. */}
        <Command shouldFilter={false}>
          <CommandInput value={input} onValueChange={setInput} placeholder="Search a city…" />
          <CommandList>
            <p
              role="status"
              className={status ? "px-3 py-3 text-sm text-muted-foreground" : "sr-only"}
            >
              {status}
            </p>

            {places.length > 0 && (
              <CommandGroup heading="Places">
                {places.map((place) => (
                  <PlaceItem key={place.key} place={place} icon={MapPin} onSelect={go} />
                ))}
              </CommandGroup>
            )}

            {!searchable && recents.length > 0 && (
              <CommandGroup heading="Recent">
                {recents.map((place) => (
                  <PlaceItem key={place.key} place={place} icon={Clock} onSelect={go} />
                ))}
              </CommandGroup>
            )}

            {!searchable && (
              <CommandGroup heading="Nearby">
                <CommandItem value="my-location" onSelect={locate}>
                  <LocateFixed aria-hidden="true" />
                  Use my location
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
  icon: typeof MapPin;
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
