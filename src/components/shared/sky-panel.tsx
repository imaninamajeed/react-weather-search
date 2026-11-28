import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { skyScene, type SkyScene as Scene } from "@/lib/weather/sky";
import type { Forecast } from "@/lib/weather/types";
import { SkyScene } from "./sky-scene";

/** The sky over a forecast's place right now. */
export function sceneFor(forecast: Pick<Forecast, "current" | "daily">): Scene {
  return skyScene(forecast.current, forecast.daily[0]);
}

type Tag = "header" | "section" | "div";

/**
 * A rounded panel painted with a sky: the gradient and ink of its palette (`data-sky`, globals.css)
 * and the scene's drifting layers behind the content. Everything inside reads the sky's own ink and
 * translucent surfaces, so buttons, badges and the hour strip need no overrides. Text goes straight
 * on it; see DESIGN.md, "Sky and illustration".
 */
export function SkyPanel({
  scene,
  as: Component = "div",
  className,
  children,
  ...props
}: {
  scene: Scene;
  as?: Tag;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  return (
    <Component
      data-sky={scene.palette}
      className={cn(
        "relative isolate overflow-hidden rounded-4xl shadow-md ring-1 ring-(--sky-line) dark:shadow-none",
        className,
      )}
      {...props}
    >
      <SkyScene scene={scene} />
      {children}
    </Component>
  );
}
