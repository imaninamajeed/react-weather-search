"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { ExpressionSpecification, Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { INTL_TAGS, type Locale } from "@/lib/i18n/locales";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { RADAR_MAX_ZOOM, minutesBeforeLatest, radarTileUrl, type RadarData } from "@/lib/map/radar";
import type { PointWeather } from "@/lib/map/point";
import { coordinateKey, coordinateLabel, placeHref } from "@/lib/places";
import { convertTemperature, formatSpeed } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Units } from "@/lib/weather/types";

export interface MapPlace {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  isHome: boolean;
}

interface WeatherMapProps {
  places: MapPlace[];
  radar: RadarData | null;
  units: Units;
  center: { latitude: number; longitude: number };
  /** Opened on one specific place: stay centred on it instead of fitting all markers. */
  focused?: boolean;
}

const STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

type Theme = keyof typeof STYLES;

/** A place's pop-up opens a little off its point: close in the pin has stepped aside, so only the ring is there. */
const PLACE_POPUP_OFFSET = 10;

/** How far a selected place is zoomed to: close enough that the pin gives way to its area. */
const SELECT_ZOOM = 11;
/** From this zoom in, pins give way to the area around each place. */
const AREA_ZOOM = 10;
const AREA_RADIUS_KM = 6;
const FRAME_INTERVAL_MS = 700;
const LOAD_TIMEOUT_MS = 15_000;
const radarId = (index: number) => `radar-${index}`;

/** Adds one raster layer per frame, all hidden; showing a frame is then just an opacity change, with no reload flicker. */
function addRadar(map: MapLibreMap, radar: RadarData) {
  radar.frames.forEach((frame, index) => {
    if (map.getSource(radarId(index))) return;
    map.addSource(radarId(index), {
      type: "raster",
      tiles: [radarTileUrl(radar.host, frame.path)],
      tileSize: 256,
      maxzoom: RADAR_MAX_ZOOM,
      attribution:
        '<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>',
    });
    map.addLayer({
      id: radarId(index),
      type: "raster",
      source: radarId(index),
      layout: { visibility: "none" },
      paint: { "raster-opacity": 0, "raster-fade-duration": 0 },
    });
  });
}

const AREAS_ID = "place-areas";

/**
 * Close in, a place is drawn as the area around it instead of a pin. There is no boundary data for a
 * place, so the area is a ring of AREA_RADIUS_KM around its point: a neighbourhood-scale guide, not
 * the city limit.
 */
function areaRing(longitude: number, latitude: number, steps = 72): number[][] {
  const angular = AREA_RADIUS_KM / 6371;
  const lat = (latitude * Math.PI) / 180;
  const lng = (longitude * Math.PI) / 180;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const bearing = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(angular) + Math.cos(lat) * Math.sin(angular) * Math.cos(bearing),
    );
    const lng2 =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
        Math.cos(angular) - Math.sin(lat) * Math.sin(lat2),
      );
    return [(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
  });
}

/** The place whose area is under a screen point, if the map is close enough to show areas. */
function areaAt(
  map: MapLibreMap,
  point: { x: number; y: number },
  places: MapPlace[],
): MapPlace | undefined {
  if (map.getZoom() < AREA_ZOOM || !map.getLayer(`${AREAS_ID}-fill`)) return undefined;
  const key = map.queryRenderedFeatures([point.x, point.y], { layers: [`${AREAS_ID}-fill`] })[0]
    ?.properties?.key;
  return places.find((place) => place.key === key);
}

/** Adds the areas as a soft fill and a dashed outline that only appear from AREA_ZOOM in. */
function addAreas(map: MapLibreMap, places: MapPlace[]) {
  if (map.getSource(AREAS_ID)) return;
  map.addSource(AREAS_ID, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: places.map((place) => ({
        type: "Feature",
        properties: { home: place.isHome, key: place.key },
        geometry: { type: "Polygon", coordinates: [areaRing(place.longitude, place.latitude)] },
      })),
    },
  });
  // Map styles cannot read CSS variables, so these are the brand's magenta (home) and teal.
  const color = ["case", ["get", "home"], "#ff2d95", "#14b8a6"] as ExpressionSpecification;
  map.addLayer({
    id: `${AREAS_ID}-fill`,
    type: "fill",
    source: AREAS_ID,
    minzoom: AREA_ZOOM,
    paint: { "fill-color": color, "fill-opacity": 0.1 },
  });
  map.addLayer({
    id: `${AREAS_ID}-line`,
    type: "line",
    source: AREAS_ID,
    minzoom: AREA_ZOOM,
    paint: { "line-color": color, "line-width": 2.5, "line-dasharray": [2, 1.5] },
  });
}

/**
 * Shows one frame. Only that frame's tiles are requested until the visitor plays or scrubs;
 * then every frame is kept loaded (opacity 0) so stepping through them doesn't flicker. This
 * keeps a plain page view to a handful of requests, well inside RainViewer's rate limit.
 */
function showFrame(
  map: MapLibreMap,
  count: number,
  index: number,
  opacity: number,
  preloadAll: boolean,
) {
  for (let i = 0; i < count; i++) {
    const id = radarId(i);
    if (!map.getLayer(id)) continue;
    map.setLayoutProperty(id, "visibility", i === index || preloadAll ? "visible" : "none");
    map.setPaintProperty(id, "raster-opacity", i === index ? opacity / 100 : 0);
  }
}

// Lucide's "house" and "map-pin" (ISC), as static markup.
const HOUSE_ICON =
  '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
const PIN_ICON =
  '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>';

const WIND_ICON =
  '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>';
const DROPLET_ICON =
  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>';

function iconElement(paths: string, size = "size-3.5"): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", size);
  svg.innerHTML = paths; // static markup above, never user input
  return svg;
}

/**
 * A place as a pin on the map, set in the heading face (Oxanium): a card-coloured pill with a badge
 * (a house on the brand colour for home, a pin on grey for the rest) and the name, ending in a tip.
 * The marker is anchored at the tip, so it marks the exact spot. It carries no temperature: the
 * weather is in the pop-up, which shows while the pointer or keyboard is on the pin. A plain click
 * zooms in on the pin (the pop-up stays only while the pointer is on it, or for a tap) rather than
 * leaving the page; a modified click still opens
 * the forecast in a new tab, as for any link. The selected pin is marked with `data-selected`.
 * Built with the DOM API, never user-provided markup.
 */
interface PinHandlers {
  /** A click: zoom in. `keep` is for a finger or pen, which cannot hover: the pop-up then stays open. */
  select: (place: MapPlace, keep: boolean) => void;
  /** The pointer or keyboard reached the pin: show its pop-up for as long as it stays. */
  preview: (place: MapPlace) => void;
  /** It left. */
  leave: () => void;
}

function markerElement(place: MapPlace, handlers: PinHandlers): HTMLAnchorElement {
  const home = place.isHome;
  const link = document.createElement("a");
  link.href = placeHref(place);
  link.dataset.placeKey = place.key;
  link.style.zIndex = home ? "2" : "1";
  link.className =
    "group flex flex-col items-center font-heading outline-none transition-[translate] hover:-translate-y-0.5 focus-visible:-translate-y-0.5 data-selected:-translate-y-0.5";

  const badge = document.createElement("span");
  badge.className =
    "grid size-5 shrink-0 place-items-center rounded-full " +
    (home ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground");
  badge.append(iconElement(home ? HOUSE_ICON : PIN_ICON));
  const name = document.createElement("span");
  name.className = "max-w-36 truncate";
  name.textContent = place.name;

  const pill = document.createElement("span");
  pill.className =
    "flex items-center gap-1.5 rounded-full border bg-card py-1 pr-3 pl-1 text-xs font-medium text-card-foreground shadow-md transition-colors group-hover:bg-accent group-focus-visible:ring-2 group-focus-visible:ring-ring group-data-selected:ring-2 group-data-selected:ring-ring " +
    (home ? "border-primary" : "border-border");
  pill.append(badge, name);

  // The tip: a rotated square tucked under the pill, in the pill's own colours.
  const tip = document.createElement("span");
  tip.setAttribute("aria-hidden", "true");
  tip.className =
    "-mt-1 size-2 rotate-45 border-r border-b bg-card " +
    (home ? "border-primary" : "border-border");
  link.append(pill, tip);

  link.addEventListener("click", (event) => {
    event.stopPropagation(); // don't also open the "weather here" popup
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const touch = (event as PointerEvent).pointerType;
    handlers.select(place, touch === "touch" || touch === "pen");
  });
  // Home is the place you already know, so pointing at its pin shows nothing; a click still zooms in.
  if (!home) {
    link.addEventListener("mouseenter", () => handlers.preview(place));
    link.addEventListener("mouseleave", handlers.leave);
    link.addEventListener("focus", () => handlers.preview(place));
    link.addEventListener("blur", handlers.leave);
  }
  return link;
}

/** The name line of a place's pop-up: the pin's badge and the name, in the heading face. */
function placeHeader(place: MapPlace): HTMLElement {
  const badge = document.createElement("span");
  badge.className =
    "grid size-5 shrink-0 place-items-center rounded-full " +
    (place.isHome ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground");
  badge.append(iconElement(place.isHome ? HOUSE_ICON : PIN_ICON));
  const name = document.createElement("span");
  name.className = "truncate";
  name.textContent = place.name;
  const row = document.createElement("p");
  row.className =
    "flex items-center gap-2 font-heading text-[0.6875rem] font-medium tracking-[0.1em] uppercase";
  row.append(badge, name);
  return row;
}

/** The pop-up for a saved place while its weather loads: its name, grey bars where the numbers will be, and the link. */
function placeholderContent(
  place: MapPlace,
  openLabel: string,
  onOpen: (href: string) => void,
): HTMLElement {
  const root = document.createElement("div");
  root.className = "min-w-48 space-y-2";
  const bar = (className: string) => {
    const el = document.createElement("div");
    el.className = "animate-pulse rounded-full bg-muted " + className;
    return el;
  };
  root.append(
    placeHeader(place),
    bar("h-8 w-24"),
    bar("h-3 w-36"),
    pillLink(placeHref(place), openLabel, onOpen),
  );
  return root;
}

function popupContent(
  data: PointWeather,
  units: Units,
  locale: Locale,
  latitude: number,
  longitude: number,
  onOpen: (href: string) => void,
  /** When the pop-up is for a saved place: it is dressed like its pin, and the link goes to that place. */
  place?: MapPlace,
): HTMLElement {
  const text = getMessages(locale).map.popup;
  const condition =
    typeof data.weatherCode === "number"
      ? describeWeather(data.weatherCode, data.isDay, locale).label
      : data.condition;
  const unit = units === "metric" ? "°C" : "°F";
  const degrees = (celsius: number) => `${Math.round(convertTemperature(celsius, units))}${unit}`;

  const root = document.createElement("div");
  root.className = place ? "min-w-48 space-y-2" : "min-w-44 space-y-1";
  const add = (className: string, content: string) => {
    const el = document.createElement("p");
    el.className = className;
    el.textContent = content;
    root.append(el);
  };

  if (place) root.append(placeHeader(place));
  else {
    add(
      "font-heading text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground",
      coordinateLabel(latitude, longitude),
    );
  }

  const big = document.createElement("p");
  big.className = "font-heading text-3xl font-semibold leading-none";
  big.append(String(Math.round(convertTemperature(data.temperature, units))));
  const unitMark = document.createElement("span");
  unitMark.className = "align-top text-base font-normal text-(--brand-teal-text)";
  unitMark.textContent = unit;
  big.append(unitMark);
  root.append(big);

  if (place) {
    // Dressed like the pin: the condition, then wind and rain as two small icon-and-number facts.
    add("text-sm", text.feels(condition, degrees(data.apparentTemperature)));
    const fact = (icon: string, value: string) => {
      const item = document.createElement("span");
      item.className = "flex items-center gap-1";
      item.append(iconElement(icon, "size-3.5 text-(--brand-teal-text)"), value);
      return item;
    };
    const facts = document.createElement("p");
    facts.className = "flex items-center gap-3 text-xs text-muted-foreground tabular-nums";
    facts.append(
      fact(WIND_ICON, formatSpeed(data.windSpeed, units)),
      fact(DROPLET_ICON, `${data.rainChance}%`),
    );
    root.append(facts, pillLink(placeHref(place), text.openForecast, onOpen));
    return root;
  }

  add("text-sm", text.feels(condition, degrees(data.apparentTemperature)));
  add(
    "text-sm text-muted-foreground",
    text.windRain(formatSpeed(data.windSpeed, units), data.rainChance),
  );
  root.append(
    forecastLink(placeHref({ key: coordinateKey(latitude, longitude) }), text.openForecast, onOpen),
  );
  return root;
}

/** The pop-up's link as a pill, like the pin: it goes to the forecast without a full page load. */
function pillLink(href: string, label: string, onOpen: (href: string) => void): HTMLAnchorElement {
  const link = forecastLink(href, label, onOpen);
  link.className =
    "mt-1 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent";
  return link;
}

function forecastLink(
  href: string,
  label: string,
  onOpen: (href: string) => void,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = href;
  link.className = "mt-2 inline-block text-sm font-medium underline underline-offset-4";
  link.textContent = label;
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onOpen(href);
  });
  return link;
}

const noopSubscribe = () => () => {};

export function WeatherMap({ places, radar, units, center, focused = false }: WeatherMapProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useMessages();
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "dark" ? "dark" : "light";
  // Frame times are shown in the viewer's timezone, which the server can't know.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const frames = radar?.frames ?? [];
  const [index, setIndex] = useState(Math.max(frames.length - 1, 0));
  const [playing, setPlaying] = useState(false);
  const [opacity, setOpacity] = useState(70);
  const [preload, setPreload] = useState(false);
  const [failed, setFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const appliedTheme = useRef<Theme>(theme);
  // The map is created once; it reads the latest radar state and theme from these refs.
  const live = useRef<{
    index: number;
    opacity: number;
    theme: Theme;
    count: number;
    preload: boolean;
    locale: Locale;
    t: Messages;
  }>({
    index,
    opacity,
    theme,
    count: frames.length,
    preload,
    locale,
    t,
  });

  useEffect(() => {
    live.current = { index, opacity, theme, count: frames.length, preload, locale, t };
    const map = mapRef.current;
    if (map?.isStyleLoaded()) showFrame(map, frames.length, index, opacity, preload);
  }, [index, opacity, theme, frames.length, preload, locale, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && appliedTheme.current !== theme) {
      appliedTheme.current = theme;
      map.setStyle(STYLES[theme]); // custom layers are re-added on "style.load"
    }
  }, [theme]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % frames.length), FRAME_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, frames.length]);

  useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | undefined;
    let popup: Popup | undefined;
    let abort: AbortController | undefined;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const markers: Marker[] = [];
    const open = (href: string) => router.push(href);

    // A pin's pop-up shows only while the pointer or focus is on the pin (or the pop-up). A tap keeps it,
    // since a finger cannot hover.
    let pinned = false;
    let shownKey: string | null = null;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    const cancelLeave = () => clearTimeout(leaveTimer);
    const leave = () => {
      clearTimeout(hoverTimer);
      if (pinned) return;
      leaveTimer = setTimeout(() => popup?.remove(), 220);
    };
    // The pointer is on one of the map's own buttons (zoom, center, credits): no pop-up for those.
    let overControls = false;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") popup?.remove();
    };
    window.addEventListener("keydown", closeOnEscape);

    /**
     * Opens the pop-up at a point and fills it with that point's weather. For a saved place it opens
     * at once with the place's name and a link to its forecast, so there is always something to
     * click while the weather loads (or if it can't).
     */
    /** Marks one pin as the selected one (or none), for its styling. */
    function markSelected(key: string | null) {
      containerRef.current
        ?.querySelectorAll<HTMLElement>("[data-place-key]")
        .forEach((pin) => pin.toggleAttribute("data-selected", pin.dataset.placeKey === key));
    }

    function showPopup(
      maplibre: typeof import("maplibre-gl"),
      current: MapLibreMap,
      point: { lng: number; lat: number },
      place?: MapPlace,
    ) {
      abort?.abort();
      abort = new AbortController();
      popup?.remove();
      const text = live.current.t.map.popup;
      const body = document.createElement("div");
      body.className = "text-sm";
      if (place) body.append(placeholderContent(place, text.openForecast, open));
      else body.textContent = text.loading;
      const note = (message: string) => {
        const el = document.createElement("p");
        el.className = "text-muted-foreground";
        el.textContent = message;
        body.replaceChildren(
          ...(place ? [placeHeader(place)] : []),
          el,
          ...(place ? [pillLink(placeHref(place), text.openForecast, open)] : []),
        );
      };
      popup = new maplibre.Popup({
        maxWidth: "280px",
        offset: place ? PLACE_POPUP_OFFSET : 0,
        // A place's pop-up follows the pointer on and off its pin, and is closed by Escape, by the
        // map being clicked, or by the pointer leaving; a plain map pop-up keeps its close button.
        closeButton: !place,
        closeOnClick: !place,
        className: place ? "place-popup" : undefined,
      })
        .setLngLat([point.lng, point.lat])
        .setDOMContent(body)
        .addTo(current);
      shownKey = place?.key ?? null;
      // Closing it (by hand, or by opening another) unmarks the pin and lets go of the pin's hold.
      popup.on("close", () => {
        markSelected(null);
        shownKey = null;
        pinned = false;
      });
      if (place) {
        // Moving from the pin onto its pop-up keeps it open (to reach the link), and leaving ends it.
        const element = popup.getElement();
        element.addEventListener("mouseenter", cancelLeave);
        element.addEventListener("mouseleave", leave);
      }

      fetch(`/api/weather/point?lat=${point.lat.toFixed(2)}&lon=${point.lng.toFixed(2)}`, {
        signal: abort.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Point weather failed (${response.status})`);
          return response.json() as Promise<PointWeather>;
        })
        .then((data) =>
          body.replaceChildren(
            popupContent(data, units, live.current.locale, point.lat, point.lng, open, place),
          ),
        )
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          note(text.failed);
        });
    }

    (async () => {
      try {
        // Loaded on demand: MapLibre is large and only this page needs it.
        const maplibre = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;
        // See scripts/copy-maplibre-worker.mjs: the bundler breaks MapLibre's default worker URL.
        maplibre.setWorkerUrl(`/maplibre-gl-worker.mjs?v=${maplibre.getVersion()}`);

        map = new maplibre.Map({
          container: containerRef.current,
          style: STYLES[live.current.theme],
          center: [center.longitude, center.latitude],
          zoom: focused || places.length <= 1 ? 6 : 3,
          attributionControl: { compact: true },
          fadeDuration: 0,
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        const current = map;
        current.on("style.load", () => {
          if (radar) addRadar(current, radar);
          addAreas(current, places);
          showFrame(
            current,
            live.current.count,
            live.current.index,
            live.current.opacity,
            live.current.preload,
          );
        });
        loadTimer = setTimeout(() => {
          if (!current.loaded()) setFailed(true);
        }, LOAD_TIMEOUT_MS);
        current.once("load", () => clearTimeout(loadTimer));

        const preview = (place: MapPlace) => {
          if (pinned || overControls) return;
          cancelLeave();
          clearTimeout(hoverTimer);
          if (shownKey === place.key) return;
          // A short delay, so sweeping the pointer across pins does not flash a pop-up for each.
          hoverTimer = setTimeout(() => {
            showPopup(maplibre, current, { lng: place.longitude, lat: place.latitude }, place);
            markSelected(place.key);
          }, 120);
        };
        const select = (place: MapPlace, keep: boolean) => {
          clearTimeout(hoverTimer);
          cancelLeave();
          // Zoom in on it (never out), then show its pop-up.
          current.flyTo({
            center: [place.longitude, place.latitude],
            zoom: Math.max(current.getZoom(), SELECT_ZOOM),
            duration: 800,
          });
          showPopup(maplibre, current, { lng: place.longitude, lat: place.latitude }, place);
          // After the pop-up opens, because opening it closed the last one, which clears the mark.
          markSelected(place.key);
          // A mouse or keyboard has hover and focus, so the pop-up goes when they do; only a finger stays.
          pinned = keep;
        };
        for (const place of places) {
          markers.push(
            new maplibre.Marker({
              element: markerElement(place, { select, preview, leave }),
              anchor: "bottom",
            })
              .setLngLat([place.longitude, place.latitude])
              .addTo(current),
          );
        }
        // Close in, the area is drawn instead of the pins, so the pins step aside (and leave the tab order).
        const syncPins = () => {
          const close = current.getZoom() >= AREA_ZOOM;
          markers.forEach((marker) => {
            const pin = marker.getElement();
            pin.style.visibility = close ? "hidden" : "visible";
            pin.style.opacity = close ? "0" : "1";
          });
        };
        current.on("zoom", syncPins);
        syncPins();

        // The view the map opens on: every place in frame, or the one place it was opened for.
        const showStart = (duration: number) => {
          if (places.length > 1 && !focused) {
            const bounds = new maplibre.LngLatBounds();
            places.forEach((place) => bounds.extend([place.longitude, place.latitude]));
            current.fitBounds(bounds, { padding: 90, maxZoom: 6, duration });
          } else {
            current.flyTo({ center: [center.longitude, center.latitude], zoom: 6, duration });
          }
        };
        if (places.length > 1 && !focused) showStart(0);

        // A button under the zoom buttons that returns to that view, whatever you have panned or
        // zoomed to, and closes any pop-up.
        const recenterLabel = live.current.t.map.center;
        let recenterButton: HTMLElement | undefined;
        current.addControl(
          {
            onAdd() {
              recenterButton = document.createElement("div");
              recenterButton.className = "maplibregl-ctrl maplibregl-ctrl-group";
              const button = document.createElement("button");
              button.type = "button";
              button.title = recenterLabel;
              button.setAttribute("aria-label", recenterLabel);
              button.innerHTML =
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="margin:auto"><circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>';
              button.addEventListener("click", () => {
                abort?.abort();
                popup?.remove();
                showStart(800);
              });
              recenterButton.append(button);
              return recenterButton;
            },
            onRemove() {
              recenterButton?.remove();
            },
          },
          "top-right",
        );

        // Reaching for a button closes a pin's pop-up at once (unless a tap is holding it) and keeps
        // it from opening until the pointer is back on the map.
        const controls = current.getContainer().querySelector(".maplibregl-control-container");
        controls?.addEventListener("mouseover", (event) => {
          if (!(event.target as Element).closest(".maplibregl-ctrl")) return;
          overControls = true;
          clearTimeout(hoverTimer);
          cancelLeave();
          if (!pinned) popup?.remove();
        });
        controls?.addEventListener("mouseout", (event) => {
          if ((event.target as Element).closest(".maplibregl-ctrl")) overControls = false;
        });

        // Close in, the pop-up follows the pointer into and out of a place's circle, as it does the pin.
        current.on("mousemove", (event) => {
          const place = areaAt(current, event.point, places);
          current.getCanvas().style.cursor = place ? "pointer" : "";
          if (place) preview(place);
          else if (current.getZoom() >= AREA_ZOOM) leave();
        });
        current.on("mouseout", () => {
          if (current.getZoom() >= AREA_ZOOM) leave();
        });
        current.on("click", (event) => {
          // A tap inside a circle is a tap on the place (a finger cannot hover); elsewhere, the spot.
          const place = areaAt(current, event.point, places);
          if (!place) return showPopup(maplibre, current, event.lngLat.wrap());
          const touch = (event.originalEvent as PointerEvent).pointerType;
          clearTimeout(hoverTimer);
          showPopup(maplibre, current, { lng: place.longitude, lat: place.latitude }, place);
          markSelected(place.key);
          pinned = touch === "touch" || touch === "pen";
        });
      } catch {
        // No WebGL, or the library failed to load.
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      window.removeEventListener("keydown", closeOnEscape);
      clearTimeout(hoverTimer);
      clearTimeout(leaveTimer);
      clearTimeout(loadTimer);
      abort?.abort();
      popup?.remove();
      markers.forEach((marker) => marker.remove());
      map?.remove();
      mapRef.current = null;
    };
    // The map is created once. Prop changes remount it (the page keys it), and later state
    // changes reach it through the refs and effects above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = frames[frames.length - 1];
  const earlier = minutesBeforeLatest(frames, index);
  const frameTime =
    mounted && frames[index]
      ? new Intl.DateTimeFormat(INTL_TAGS[locale], { hour: "numeric", minute: "2-digit" }).format(
          new Date(frames[index].time * 1000),
        )
      : "";
  const frameLabel = frameTime
    ? `${frameTime} ${earlier === 0 ? t.map.radar.latest : t.map.radar.earlier(earlier)}`
    : "";

  return (
    <div className="space-y-4 fit:flex fit:flex-col fit:gap-3 fit:space-y-0">
      <div
        className="relative h-[calc(100svh-33rem)] min-h-96 overflow-hidden rounded-xl border border-border bg-muted lg:h-[calc(100svh-29rem)]"
        role="region"
        aria-label={t.map.region}
      >
        <div ref={containerRef} className="size-full" />
        {failed && (
          <div
            role="alert"
            className="absolute inset-0 flex items-center justify-center bg-card p-6 text-center"
          >
            <p className="max-w-sm text-muted-foreground">{t.map.mapFailed}</p>
          </div>
        )}
      </div>

      {radar && latest ? (
        <div className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-[1fr_16rem] md:items-center fit:p-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              aria-label={playing ? t.map.radar.pause : t.map.radar.play}
              aria-pressed={playing}
              onClick={() => {
                setPreload(true);
                setPlaying((value) => !value);
              }}
            >
              {playing ? (
                <IconPlayerPause aria-hidden="true" />
              ) : (
                <IconPlayerPlay aria-hidden="true" />
              )}
            </Button>
            <div className="min-w-0 flex-1">
              <Slider
                min={0}
                max={frames.length - 1}
                step={1}
                value={[index]}
                onValueChange={([value]) => {
                  setPreload(true);
                  setPlaying(false);
                  setIndex(value);
                }}
                thumbLabel={t.map.radar.time}
                valueText={(value) => {
                  const m = minutesBeforeLatest(frames, value);
                  return m === 0 ? t.map.radar.latestFrame : t.map.radar.minutesBefore(m);
                }}
              />
              <p className="label-caps mt-2" aria-live="off">
                {t.map.radar.caption(frameLabel || "—")}
              </p>
            </div>
          </div>
          <div>
            <Slider
              min={20}
              max={100}
              step={5}
              value={[opacity]}
              onValueChange={([value]) => setOpacity(value)}
              thumbLabel={t.map.radar.opacity}
              valueText={(value) => t.map.radar.percent(value)}
            />
            <p className="label-caps mt-2">{t.map.radar.opacityCaption(opacity)}</p>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t.map.radar.unavailable}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {t.map.credit.radarBy}{" "}
        <a
          className="underline underline-offset-4"
          href="https://www.rainviewer.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          RainViewer
        </a>
        {t.map.credit.afterRadar}{" "}
        <a
          className="underline underline-offset-4"
          href="https://openfreemap.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenFreeMap
        </a>
        {t.map.credit.afterBasemap}
      </p>
    </div>
  );
}
