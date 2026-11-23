import { z } from "zod";

/**
 * RainViewer radar frames. Only plain data and a URL builder live here, so the server fetch
 * and the client map can share them.
 */

// Anything that ends up in a tile URL is validated: it comes from a third party.
const hostSchema = z.string().regex(/^https:\/\/[a-z0-9.-]+\.rainviewer\.com$/);
const pathSchema = z.string().regex(/^\/v2\/radar\/[a-z0-9]+$/);

export const radarResponseSchema = z.object({
  host: hostSchema,
  radar: z.object({
    past: z.array(z.object({ time: z.number().int().positive(), path: pathSchema })),
  }),
});

export interface RadarFrame {
  /** Unix seconds. */
  time: number;
  path: string;
}

export interface RadarData {
  host: string;
  /** Oldest first. */
  frames: RadarFrame[];
}

/**
 * The free tier serves real tiles up to zoom 7 and a "Zoom Level Not Supported" placeholder
 * beyond it, so the layer stops at 7 and the map scales those tiles when zoomed further in.
 */
export const RADAR_MAX_ZOOM = 7;

/** 256 px tiles, "universal blue" colour scheme (2), smoothed, with snow shown (1_1). */
export const radarTileUrl = (host: string, path: string) =>
  `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;

export function normalizeRadar(raw: z.infer<typeof radarResponseSchema>): RadarData {
  return {
    host: raw.host,
    frames: [...raw.radar.past].sort((a, b) => a.time - b.time),
  };
}

/** How long before the newest frame this one is, in whole minutes. */
export function minutesBeforeLatest(frames: RadarFrame[], index: number): number {
  const latest = frames[frames.length - 1];
  const frame = frames[index];
  return latest && frame ? Math.round((latest.time - frame.time) / 60) : 0;
}
