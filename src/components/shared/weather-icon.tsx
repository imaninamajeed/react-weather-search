import { cn } from "@/lib/utils";
import type { WeatherIconName } from "@/lib/weather/codes";
import { WeatherGlyph } from "./weather-glyphs";

/**
 * Decorative: the condition is always also written out next to it. `animated` is for the one large
 * icon in a hero (a slowly turning sun, a drifting cloud, falling rain); it only moves when the
 * visitor hasn't asked for reduced motion.
 */
export function WeatherIcon({
  name,
  className,
  animated = false,
}: {
  name: WeatherIconName;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-weather-icon={name}
      className={cn("size-5 shrink-0 overflow-visible", className)}
    >
      <WeatherGlyph name={name} animated={animated} />
    </svg>
  );
}
