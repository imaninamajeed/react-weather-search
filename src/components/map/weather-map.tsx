"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
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
import { formatSpeed, formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Units } from "@/lib/weather/types";

export interface MapPlace {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Already formatted in the viewer's units, e.g. "29°". */
  temperature: string;
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

/** A saved location as a focusable link on the map. Built with the DOM API, never innerHTML. */
function markerElement(place: MapPlace, onOpen: (href: string) => void): HTMLAnchorElement {
  const href = placeHref(place);
  const link = document.createElement("a");
  link.href = href;
  link.className =
    "flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-card-foreground shadow-md transition-colors hover:bg-accent focus-visible:outline-2 " +
    (place.isHome ? "border-primary ring-2 ring-primary/30" : "border-border");
  const name = document.createElement("span");
  name.textContent = place.name;
  const temperature = document.createElement("span");
  temperature.className = "font-semibold";
  temperature.textContent = place.temperature;
  link.append(name, temperature);
  link.addEventListener("click", (event) => {
    event.stopPropagation(); // don't also open the "weather here" popup
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onOpen(href);
  });
  return link;
}

function popupContent(
  data: PointWeather,
  units: Units,
  locale: Locale,
  latitude: number,
  longitude: number,
  onOpen: (href: string) => void,
): HTMLElement {
  const root = document.createElement("div");
  root.className = "min-w-44 space-y-1";
  const add = (className: string, text: string) => {
    const el = document.createElement("p");
    el.className = className;
    el.textContent = text;
    root.append(el);
  };
  add(
    "font-heading text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground",
    coordinateLabel(latitude, longitude),
  );
  add("text-3xl font-semibold leading-none", formatTemperature(data.temperature, units));
  const text = getMessages(locale).map.popup;
  const condition =
    typeof data.weatherCode === "number"
      ? describeWeather(data.weatherCode, data.isDay, locale).label
      : data.condition;
  add("text-sm", text.feels(condition, formatTemperature(data.apparentTemperature, units)));
  add(
    "text-sm text-muted-foreground",
    text.windRain(formatSpeed(data.windSpeed, units), data.rainChance),
  );

  const href = placeHref({ key: coordinateKey(latitude, longitude) });
  const link = document.createElement("a");
  link.href = href;
  link.className = "mt-2 inline-block text-sm font-medium underline underline-offset-4";
  link.textContent = text.openForecast;
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onOpen(href);
  });
  root.append(link);
  return root;
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

        for (const place of places) {
          markers.push(
            new maplibre.Marker({ element: markerElement(place, open) })
              .setLngLat([place.longitude, place.latitude])
              .addTo(current),
          );
        }
        if (places.length > 1 && !focused) {
          const bounds = new maplibre.LngLatBounds();
          places.forEach((place) => bounds.extend([place.longitude, place.latitude]));
          current.fitBounds(bounds, { padding: 90, maxZoom: 6, duration: 0 });
        }

        current.on("click", (event) => {
          abort?.abort();
          abort = new AbortController();
          popup?.remove();
          const { lng, lat } = event.lngLat.wrap();
          const body = document.createElement("div");
          body.className = "text-sm";
          body.textContent = live.current.t.map.popup.loading;
          popup = new maplibre.Popup({ maxWidth: "280px" })
            .setLngLat(event.lngLat)
            .setDOMContent(body)
            .addTo(current);

          fetch(`/api/weather/point?lat=${lat.toFixed(2)}&lon=${lng.toFixed(2)}`, {
            signal: abort.signal,
          })
            .then((response) => {
              if (!response.ok) throw new Error(`Point weather failed (${response.status})`);
              return response.json() as Promise<PointWeather>;
            })
            .then((data) =>
              body.replaceChildren(popupContent(data, units, live.current.locale, lat, lng, open)),
            )
            .catch((error: unknown) => {
              if (error instanceof DOMException && error.name === "AbortError") return;
              body.textContent = live.current.t.map.popup.failed;
            });
        });
      } catch {
        // No WebGL, or the library failed to load.
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
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
        className="relative h-[calc(100svh-23.5rem)] min-h-96 overflow-hidden rounded-xl border border-border bg-muted lg:h-[calc(100svh-19.5rem)]"
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
