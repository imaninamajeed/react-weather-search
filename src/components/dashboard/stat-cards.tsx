import {
  IconArrowUp,
  IconDroplet,
  IconSun,
  IconTemperature,
  IconTrendingDown,
  IconTrendingUp,
  IconWind,
  type Icon,
} from "@tabler/icons-react";
import type { CSSProperties, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDuration, formatTime } from "@/lib/format";
import {
  compassPoint,
  formatPrecipitation,
  formatSpeed,
  formatTemperature,
  formatTemperatureDelta,
} from "@/lib/units";
import { uvCategory } from "@/lib/weather/uv";
import type { Forecast, Units } from "@/lib/weather/types";

function StatCard({
  icon: StatIcon,
  accent,
  label,
  value,
  badge,
  headline,
  detail,
}: {
  icon: Icon;
  /** One of the app mark's colours, for the icon. */
  accent: string;
  label: string;
  value: ReactNode;
  badge: ReactNode;
  headline: string;
  detail: string;
}) {
  return (
    <Card className="@container/card" style={{ "--accent-color": accent } as CSSProperties}>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-full bg-[color-mix(in_oklch,var(--accent-color)_16%,transparent)] text-[color-mix(in_oklch,var(--accent-color)_70%,var(--foreground))]"
          >
            <StatIcon className="size-4" />
          </span>
          {label}
        </CardDescription>
        <CardTitle className="mt-1 text-3xl font-semibold tabular-nums @[16rem]/card:text-4xl">
          {value}
        </CardTitle>
        <CardAction>{badge}</CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <p className="font-medium">{headline}</p>
        <p className="text-muted-foreground">{detail}</p>
      </CardFooter>
    </Card>
  );
}

/** Today's four numbers worth a glance, as the shadcn dashboard's row of section cards. */
export function StatCards({ forecast, units }: { forecast: Forecast; units: Units }) {
  const { current } = forecast;
  const today = forecast.daily[0];
  const difference = current.apparentTemperature - current.temperature;
  const feelsWarmer = difference > 0.5;
  const feelsColder = difference < -0.5;
  const uv = uvCategory(current.uvIndex);

  return (
    <div className="grid gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:from-primary/10">
      <StatCard
        icon={IconTemperature}
        accent="var(--brand-magenta)"
        label="Feels Like"
        value={formatTemperature(current.apparentTemperature, units)}
        badge={
          <Badge variant="outline">
            {feelsWarmer ? <IconTrendingUp /> : feelsColder ? <IconTrendingDown /> : null}
            {feelsWarmer || feelsColder
              ? `${formatTemperatureDelta(difference, units)} vs Actual`
              : "Same as Actual"}
          </Badge>
        }
        headline={`Humidity ${Math.round(current.humidity)}%`}
        detail={`Dew point ${formatTemperature(current.dewPoint, units)}`}
      />
      <StatCard
        icon={IconSun}
        accent="var(--brand-violet)"
        label="Today's Range"
        value={`${formatTemperature(today.temperatureMax, units)} / ${formatTemperature(today.temperatureMin, units)}`}
        badge={<Badge variant="outline">{formatDuration(today.daylightSeconds)} Daylight</Badge>}
        headline={`Sunrise ${formatTime(today.sunrise)}`}
        detail={`Sunset ${formatTime(today.sunset)}`}
      />
      <StatCard
        icon={IconDroplet}
        accent="var(--brand-indigo)"
        label="Rain Today"
        value={`${today.precipitationProbabilityMax}%`}
        badge={
          <Badge variant="outline">{formatPrecipitation(today.precipitationSum, units)}</Badge>
        }
        headline="Chance of rain"
        detail={`Cloud cover ${Math.round(current.cloudCover)}% right now`}
      />
      <StatCard
        icon={IconWind}
        accent="var(--brand-teal-text)"
        label="Wind"
        value={formatSpeed(current.windSpeed, units)}
        badge={
          <Badge variant="outline">
            <IconArrowUp
              aria-hidden="true"
              style={{ rotate: `${Math.round(current.windDirection + 180)}deg` }}
            />
            From {compassPoint(current.windDirection)}
          </Badge>
        }
        headline={`Gusts up to ${formatSpeed(current.windGusts, units)}`}
        detail={`UV index ${Math.round(current.uvIndex)} · ${uv.label}`}
      />
    </div>
  );
}
