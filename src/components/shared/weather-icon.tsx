import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherIconName } from "@/lib/weather/codes";

const ICONS: Record<WeatherIconName, LucideIcon> = {
  "clear-day": Sun,
  "clear-night": Moon,
  "partly-cloudy-day": CloudSun,
  "partly-cloudy-night": CloudMoon,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  "freezing-rain": Snowflake,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
  hail: CloudHail,
};

/** Decorative: the condition is always also written out next to it. */
export function WeatherIcon({ name, className }: { name: WeatherIconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" strokeWidth={1.5} className={cn("size-5 shrink-0", className)} />;
}
