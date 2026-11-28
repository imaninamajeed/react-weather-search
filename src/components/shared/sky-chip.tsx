import { cn } from "@/lib/utils";
import type { WeatherIconName } from "@/lib/weather/codes";
import type { SkyScene } from "@/lib/weather/sky";
import { WeatherIcon } from "./weather-icon";

const GLOW = {
  sun: "radial-gradient(80% 80% at 85% 10%, var(--sky-glow), transparent 70%)",
  "low-sun": "radial-gradient(90% 70% at 80% 110%, var(--sky-glow), transparent 70%)",
  moon: "radial-gradient(70% 70% at 85% 10%, var(--sky-glow), transparent 70%)",
} as const;

/**
 * A place's weather as a small square of its sky with the condition's icon on it, for tiles and
 * cards where a whole sky behind the words would cost contrast. Decorative: the condition is written
 * beside it.
 */
export function SkyChip({
  scene,
  icon,
  className,
}: {
  scene: SkyScene;
  icon: WeatherIconName;
  className?: string;
}) {
  const gradient = "linear-gradient(to bottom, var(--sky-top), var(--sky-bottom))";
  return (
    <span
      aria-hidden="true"
      data-sky={scene.palette}
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ring-(--sky-line)",
        className,
      )}
      style={{ backgroundImage: scene.glow ? `${GLOW[scene.glow]}, ${gradient}` : gradient }}
    >
      <WeatherIcon name={icon} className="size-[70%]" />
    </span>
  );
}
