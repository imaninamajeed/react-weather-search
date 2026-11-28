import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Precipitation, SkyScene as Scene } from "@/lib/weather/sky";
import { Cloud } from "./weather-glyphs";

/*
 * The sky behind a hero or banner, in the palette its parent's `data-sky` names (globals.css): the
 * gradient, then in layers the light's glow, stars, drifting clouds, falling rain or
 * snow, fog, and the odd flash of lightning. Every layer is tonal (it stays on the same side of the
 * sky's ink as the sky itself), so text keeps its contrast wherever a cloud passes behind it; see the
 * note on skies in globals.css. Decorative and inert: aria-hidden, no pointer events, and still under
 * reduced motion.
 */

/** Where each glow sits: the sun high on the right, a low sun on the horizon, the moon up right. */
const GLOW = {
  sun: "radial-gradient(55% 85% at 90% 0%, var(--sky-glow), transparent 70%)",
  "low-sun": "radial-gradient(70% 70% at 85% 105%, var(--sky-glow), transparent 70%)",
  moon: "radial-gradient(45% 75% at 88% 8%, var(--sky-glow), transparent 70%)",
} as const;

/** Cloud layers from far to near: slower, larger and fainter behind; quicker and smaller in front. */
const CLOUD_LAYERS = [
  { className: "-top-[6%] -right-[8%] w-[48%] min-w-56", opacity: 0.7, duration: 70 },
  { className: "top-[34%] right-[22%] w-[30%] min-w-40", opacity: 0.85, duration: 50 },
  { className: "top-[6%] right-[38%] w-[20%] min-w-28", opacity: 0.6, duration: 38 },
];

// A fixed scatter of stars (a small linear congruential generator, so server and browser agree).
const STARS = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 28 }, () => ({
    left: next() * 100,
    top: next() * 70,
    size: next() > 0.8 ? 3 : 2,
    delay: next() * 6,
  }));
})();

const tile = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const SVG = "http://www.w3.org/2000/svg";

/** One tile of each kind of precipitation, used as a mask over the sky's --sky-fall colour. */
const FALL_TILES = {
  rain: {
    image: tile(
      `<svg xmlns='${SVG}' width='24' height='40'><path d='M5 3v11M17 23v11' stroke='black' stroke-width='1.5' stroke-linecap='round'/></svg>`,
    ),
    size: [24, 40],
    seconds: 0.55,
  },
  drizzle: {
    image: tile(
      `<svg xmlns='${SVG}' width='20' height='28'><path d='M4 3v4M14 17v4' stroke='black' stroke-width='1.5' stroke-linecap='round'/></svg>`,
    ),
    size: [20, 28],
    seconds: 0.9,
  },
  snow: {
    image: tile(
      `<svg xmlns='${SVG}' width='36' height='36'><circle cx='8' cy='8' r='2.2'/><circle cx='26' cy='24' r='1.6'/></svg>`,
    ),
    size: [36, 36],
    seconds: 7,
  },
  hail: {
    image: tile(
      `<svg xmlns='${SVG}' width='28' height='36'><circle cx='7' cy='6' r='2.4'/><path d='M20 18v9' stroke='black' stroke-width='1.5' stroke-linecap='round'/></svg>`,
    ),
    size: [28, 36],
    seconds: 0.7,
  },
} as const;

function Falling({ precipitation }: { precipitation: Precipitation }) {
  const { image, size, seconds } = FALL_TILES[precipitation.kind];
  // Heavier means a tighter tile and a more opaque layer; light rain is sparse and faint.
  const scale = [1.5, 1, 0.75][precipitation.intensity - 1];
  const [w, h] = [size[0] * scale, size[1] * scale];
  const style = {
    "--tile-h": `${h}px`,
    backgroundColor: "var(--sky-fall)",
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: `${w}px ${h}px`,
    WebkitMaskSize: `${w}px ${h}px`,
    opacity: [0.55, 0.8, 1][precipitation.intensity - 1],
    animationDuration: `${seconds}s`,
  } as CSSProperties;
  return (
    <div
      className="absolute -inset-[20%] rotate-[8deg] motion-safe:animate-[sky-fall-tile_linear_infinite]"
      style={style}
    />
  );
}

export function SkyScene({ scene, className }: { scene: Scene; className?: string }) {
  const clouds = CLOUD_LAYERS.slice(0, scene.clouds);
  return (
    <div
      aria-hidden="true"
      data-sky-art=""
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      style={{
        backgroundColor: "var(--sky-bottom)",
        backgroundImage: "linear-gradient(to bottom, var(--sky-top), var(--sky-bottom))",
      }}
    >
      {scene.glow && (
        <div className="absolute inset-0" style={{ backgroundImage: GLOW[scene.glow] }} />
      )}

      {scene.stars &&
        STARS.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-(--sky-star) motion-safe:animate-[sky-twinkle_5s_ease-in-out_infinite]"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}

      {clouds.map((layer, i) => (
        <svg
          key={i}
          viewBox="0 0 44 31"
          className={cn(
            "absolute h-auto motion-safe:animate-[sky-drift_ease-in-out_infinite_alternate]",
            layer.className,
          )}
          style={{ opacity: layer.opacity, animationDuration: `${layer.duration}s` }}
        >
          <Cloud x={0} y={0} body="var(--sky-cloud)" shade="var(--sky-cloud-shade)" />
        </svg>
      ))}

      {scene.palette === "fog" &&
        [18, 46, 72].map((top, i) => (
          <div
            key={top}
            className="absolute -left-[10%] h-[34%] w-[120%] motion-safe:animate-[sky-drift_ease-in-out_infinite_alternate]"
            style={{
              top: `${top - 12}%`,
              backgroundImage: "radial-gradient(closest-side, var(--sky-fog), transparent)",
              animationDuration: `${30 + i * 12}s`,
            }}
          />
        ))}

      {scene.precipitation && <Falling precipitation={scene.precipitation} />}

      {scene.lightning && (
        <div className="absolute inset-0 bg-(--sky-flash) opacity-0 motion-safe:animate-[sky-flash_9s_linear_infinite]" />
      )}
    </div>
  );
}
